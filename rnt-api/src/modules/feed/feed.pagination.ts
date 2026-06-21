import type { FeedPageInput } from "./feed.types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function parseFeedLimit(raw?: number): number {
  if (!raw || raw < 1) return DEFAULT_LIMIT;
  return Math.min(raw, MAX_LIMIT);
}

/**
 * Parses a base64url-encoded cursor string into its parts.
 * Cursor format (before encoding): "ISO_TIMESTAMP|EVENT_TYPE|ENTITY_ID"
 */
export function parseFeedCursor(
  cursor?: string | null,
): { occurred_at: string; tiebreak: string } | null {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length < 3) return null;

    const [occurred_at, event_type, entity_id] = parts;
    return { occurred_at, tiebreak: `${event_type}|${entity_id}` };
  } catch {
    return null;
  }
}

/**
 * Encodes a cursor from raw event data using base64url.
 * occurred_at may be a JS Date object (from the pg driver) or an ISO string —
 * always normalise to ISO 8601 so PostgreSQL can parse it back as timestamptz.
 */
export function encodeFeedCursor(
  occurred_at: string | Date,
  event_type: string,
  entity_id: string,
): string {
  const iso =
    occurred_at instanceof Date
      ? occurred_at.toISOString()
      : new Date(occurred_at).toISOString();
  return Buffer.from(`${iso}|${event_type}|${entity_id}`, "utf8").toString("base64url");
}

export function parseFeedPageQuery(query: {
  cursor?: unknown;
  limit?: unknown;
  tab?: unknown;
}): FeedPageInput {
  const limit =
    typeof query.limit === "number"
      ? query.limit
      : typeof query.limit === "string"
        ? parseInt(query.limit, 10)
        : undefined;

  const tab = query.tab === "network" ? "network" : "mine";

  return {
    cursor: typeof query.cursor === "string" ? query.cursor : null,
    limit: Number.isFinite(limit) && limit && limit > 0 ? limit : undefined,
    tab,
  };
}
