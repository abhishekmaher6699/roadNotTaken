import { queryDb } from "../../config/db";
import type {
  ActivityEvent,
  ActivityEventActor,
  ActivityEventPin,
  FeedPage,
  FeedPageInput,
} from "./feed.types";
import { feedQueries } from "./feed.queries";
import {
  encodeFeedCursor,
  parseFeedCursor,
  parseFeedLimit,
} from "./feed.pagination";

/** Shared enrichment + pagination logic used by both tabs. */
async function buildFeedPage(
  viewerUserId: string,
  rawQuery: string,
  queryName: string,
  pageInput?: FeedPageInput,
): Promise<FeedPage> {
  const limit = parseFeedLimit(pageInput?.limit);
  const cursor = parseFeedCursor(pageInput?.cursor);

  // 1. Raw event rows
  const rawResult = await queryDb(queryName, rawQuery, [
    viewerUserId,
    cursor?.occurred_at ?? null,
    cursor?.tiebreak ?? null,
    limit + 1,
  ]);

  const rows = rawResult.rows as Array<{
    event_type: string;
    actor_id: string;
    entity_id: string;
    entity_kind: "pin" | "user";
    occurred_at: Date;   // pg driver returns timestamptz as JS Date
    tiebreak: string;
  }>;

  if (rows.length === 0) {
    return { events: [], next_cursor: null, has_more: false };
  }

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  // 2. Collect unique user_ids and pin_ids for batch enrichment
  const allUserIds = new Set<string>();
  const pinIds = new Set<number>();

  for (const row of pageRows) {
    allUserIds.add(row.actor_id);
    if (row.entity_kind === "pin") {
      const pinId = parseInt(row.entity_id);
      if (!isNaN(pinId)) pinIds.add(pinId);
    } else if (row.entity_kind === "user") {
      allUserIds.add(row.entity_id);
    }
  }

  // 3. Batch fetch in parallel
  const [profilesResult, pinsResult] = await Promise.all([
    queryDb("feed.actors", feedQueries.getActorProfiles, [[...allUserIds]]),
    pinIds.size > 0
      ? queryDb("feed.pins", feedQueries.getPinDetails, [[...pinIds]])
      : Promise.resolve({ rows: [] }),
  ]);

  // 4. Lookup maps
  const profileMap = new Map<string, ActivityEventActor>();
  for (const row of profilesResult.rows) {
    profileMap.set(row.user_id, {
      user_id: row.user_id,
      username: row.username,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
    });
  }

  const pinMap = new Map<number, ActivityEventPin>();
  for (const row of pinsResult.rows) {
    pinMap.set(parseInt(row.id), {
      id: row.id,
      title: row.title,
      address: row.address ?? null,
      thumbnail_url: row.thumbnail_url ?? null,
    });
  }

  // 5. Assemble events
  const events: ActivityEvent[] = [];

  for (const row of pageRows) {
    const actor = profileMap.get(row.actor_id);
    if (!actor) continue;

    let pin: ActivityEventPin | null = null;
    let follow_target: ActivityEventActor | null = null;

    if (row.entity_kind === "pin") {
      const pinId = parseInt(row.entity_id);
      pin = pinMap.get(pinId) ?? null;
      if (!pin) continue;
    } else if (row.entity_kind === "user") {
      follow_target = profileMap.get(row.entity_id) ?? null;
    }

    events.push({
      event_type: row.event_type as ActivityEvent["event_type"],
      actor,
      pin,
      follow_target,
      occurred_at: row.occurred_at instanceof Date
        ? row.occurred_at.toISOString()
        : String(row.occurred_at),
      cursor_key: encodeFeedCursor(
        row.occurred_at,
        row.event_type,
        row.entity_id,
      ),
    });
  }

  const processedEvents = mergeVisitAndLikeEvents(events);

  const lastRow = pageRows[pageRows.length - 1];
  const next_cursor = hasMore
    ? encodeFeedCursor(lastRow.occurred_at, lastRow.event_type, lastRow.entity_id)
    : null;

  return { events: processedEvents, next_cursor, has_more: hasMore };
}

/** Merges pin_visited and pin_liked events from the same user on the same pin. */
function mergeVisitAndLikeEvents(events: ActivityEvent[]): ActivityEvent[] {
  interface GroupedEvents {
    visits: ActivityEvent[];
    likes: ActivityEvent[];
  }
  const groups = new Map<string, GroupedEvents>();

  for (const event of events) {
    if (event.event_type !== "pin_visited" && event.event_type !== "pin_liked") {
      continue;
    }
    if (!event.pin) continue;

    const key = `${event.actor.user_id}|${event.pin.id}`;
    if (!groups.has(key)) {
      groups.set(key, { visits: [], likes: [] });
    }
    const group = groups.get(key)!;
    if (event.event_type === "pin_visited") {
      group.visits.push(event);
    } else {
      group.likes.push(event);
    }
  }

  const eventsToRemove = new Set<ActivityEvent>();
  const mergedEvents: ActivityEvent[] = [];

  for (const group of groups.values()) {
    // Sort descending by occurred_at
    group.visits.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    group.likes.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

    while (group.visits.length > 0 && group.likes.length > 0) {
      const visit = group.visits.shift()!;
      const like = group.likes.shift()!;

      eventsToRemove.add(visit);
      eventsToRemove.add(like);

      const laterTimestamp = visit.occurred_at > like.occurred_at ? visit.occurred_at : like.occurred_at;
      const pin = visit.pin!;

      const mergedEvent: ActivityEvent = {
        event_type: "pin_visited_and_liked",
        actor: visit.actor,
        pin,
        follow_target: null,
        occurred_at: laterTimestamp,
        cursor_key: encodeFeedCursor(laterTimestamp, "pin_visited_and_liked", pin.id),
      };

      mergedEvents.push(mergedEvent);
    }
  }

  const remainingEvents = events.filter((e) => !eventsToRemove.has(e));
  const finalEvents = [...remainingEvents, ...mergedEvents];

  finalEvents.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  return finalEvents;
}


/** Tab: "mine" — viewer's own actions + follow events. */
export function getMyActivity(
  viewerUserId: string,
  pageInput?: FeedPageInput,
): Promise<FeedPage> {
  return buildFeedPage(
    viewerUserId,
    feedQueries.getMyActivityRaw,
    "feed.mine",
    pageInput,
  );
}

/** Tab: "network" — post-follow activity of followees. */
export function getNetworkFeed(
  viewerUserId: string,
  pageInput?: FeedPageInput,
): Promise<FeedPage> {
  return buildFeedPage(
    viewerUserId,
    feedQueries.getNetworkFeedRaw,
    "feed.network",
    pageInput,
  );
}

/** Routes to the correct tab based on pageInput.tab (defaults to "mine"). */
export function getFeed(
  viewerUserId: string,
  pageInput?: FeedPageInput,
): Promise<FeedPage> {
  return pageInput?.tab === "network"
    ? getNetworkFeed(viewerUserId, pageInput)
    : getMyActivity(viewerUserId, pageInput);
}
