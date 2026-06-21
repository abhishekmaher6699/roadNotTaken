"use client";

import { useState } from "react";
import { MapSidebarShell } from "../MapSidebarShell";
import { useFeed } from "@/features/feed";
import type { ActivityEvent, ActivityEventActor, ActivityEventType, FeedTab } from "@/features/feed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getDisplayName(actor: ActivityEventActor): string {
  return actor.display_name || actor.username || "Someone";
}

// ─── Tab switcher ─────────────────────────────────────────────────────────────

interface TabBarProps {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
}

function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="mb-3 flex rounded-xl bg-neutral-100 p-1">
      {(["mine", "network"] as FeedTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
            active === tab
              ? "bg-white text-neutral-950 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          {tab === "mine" ? "Your Activity" : "Network"}
        </button>
      ))}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ actor, onClick }: { actor: ActivityEventActor; onClick: () => void }) {
  const name = getDisplayName(actor);
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 transition hover:opacity-80"
      aria-label={`View ${name}'s profile`}
    >
      {actor.avatar_url ? (
        <img src={actor.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
          {name[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </button>
  );
}

// ─── Event sentence renderers ─────────────────────────────────────────────────

interface SentenceProps {
  event: ActivityEvent;
  isMineTab: boolean;
  onViewPin: (pinId: string) => void;
  onOpenProfile: (userId: string) => void;
}

function EventSentence({ event, isMineTab, onViewPin, onOpenProfile }: SentenceProps) {
  const { actor, pin, follow_target, event_type } = event;

  // ── Follow events ──
  if (event_type === "you_followed") {
    const targetName = follow_target ? getDisplayName(follow_target) : "someone";
    return (
      <p className="text-sm leading-5 text-neutral-700">
        <span className="font-semibold text-neutral-950">You</span>{" "}
        followed{" "}
        {follow_target ? (
          <button type="button" onClick={() => onOpenProfile(follow_target.user_id)} className="font-medium text-neutral-800 hover:underline">
            {targetName}
          </button>
        ) : <span className="font-medium text-neutral-800">{targetName}</span>}
      </p>
    );
  }

  if (event_type === "got_followed") {
    const actorName = getDisplayName(actor);
    return (
      <p className="text-sm leading-5 text-neutral-700">
        <button type="button" onClick={() => onOpenProfile(actor.user_id)} className="font-semibold text-neutral-950 hover:underline">
          {actorName}
        </button>{" "}
        followed you
      </p>
    );
  }

  // ── Pin events ──
  if (!pin) return null;

  const verb =
    event_type === "pin_created" ? (isMineTab ? "You added a new pin" : "added a new pin")
    : event_type === "pin_visited" ? (isMineTab ? "You visited" : "visited")
    : event_type === "pin_liked" ? (isMineTab ? "You liked" : "liked")
    : event_type === "pin_visited_and_liked" ? (isMineTab ? "You visited and liked" : "visited and liked")
    : "";

  return (
    <p className="text-sm leading-5 text-neutral-700">
      {!isMineTab && (
        <>
          <button type="button" onClick={() => onOpenProfile(actor.user_id)} className="font-semibold text-neutral-950 hover:underline">
            {getDisplayName(actor)}
          </button>{" "}
        </>
      )}
      <span className={isMineTab ? "font-semibold text-neutral-950" : ""}>{verb}</span>{" "}
      <button type="button" onClick={() => onViewPin(pin.id)} className="font-medium text-neutral-800 hover:underline">
        {pin.title}
      </button>
      {pin.address && (
        <span className="block mt-0.5 truncate text-xs text-neutral-400">{pin.address}</span>
      )}
    </p>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-2xl border border-neutral-100 bg-white p-3 animate-pulse">
      <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="h-3 w-3/4 rounded bg-neutral-200" />
        <div className="h-3 w-1/2 rounded bg-neutral-100" />
      </div>
    </div>
  );
}

// ─── Activity Card ─────────────────────────────────────────────────────────────

interface ActivityCardProps {
  event: ActivityEvent;
  isMineTab: boolean;
  onViewPin: (pinId: string) => void;
  onOpenProfile: (userId: string) => void;
}

function ActivityCard({ event, isMineTab, onViewPin, onOpenProfile }: ActivityCardProps) {
  const { actor, pin, event_type, occurred_at } = event;
  const isFollowEvent = event_type === "you_followed" || event_type === "got_followed";

  // For "you_followed" show the target's avatar; for all others show actor's
  const avatarSubject =
    event_type === "you_followed" && event.follow_target
      ? event.follow_target
      : actor;

  return (
    <div className="flex gap-3 rounded-2xl border border-neutral-100 bg-white p-3 transition hover:border-neutral-200 hover:shadow-sm">
      <Avatar actor={avatarSubject} onClick={() => onOpenProfile(avatarSubject.user_id)} />

      <div className="min-w-0 flex-1">
        <EventSentence
          event={event}
          isMineTab={isMineTab}
          onViewPin={onViewPin}
          onOpenProfile={onOpenProfile}
        />
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          {formatRelativeTime(occurred_at)}
        </p>
      </div>

      {!isFollowEvent && pin?.thumbnail_url && (
        <button
          type="button"
          onClick={() => onViewPin(pin.id)}
          className="shrink-0 transition hover:opacity-80"
        >
          <img src={pin.thumbnail_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
        </button>
      )}
    </div>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: FeedTab }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="text-4xl">{tab === "mine" ? "🗓️" : "🗺️"}</span>
      <p className="text-sm font-semibold text-neutral-700">
        {tab === "mine" ? "No activity yet" : "Nothing here yet"}
      </p>
      <p className="max-w-[18rem] text-xs leading-5 text-neutral-400">
        {tab === "mine"
          ? "Start exploring! Your pins, visits, and likes will appear here."
          : "Follow some explorers to see their activity here."}
      </p>
    </div>
  );
}

// ─── Tab panel ────────────────────────────────────────────────────────────────

interface TabPanelProps {
  tab: FeedTab;
  onViewPin: (pinId: string) => void;
  onOpenProfile: (userId: string) => void;
}

function TabPanel({ tab, onViewPin, onOpenProfile }: TabPanelProps) {
  const { events, hasMore, isLoading, isLoadingMore, error, refresh, loadMore } = useFeed(tab);
  const isMineTab = tab === "mine";

  return (
    <div className="space-y-2">
      {isLoading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
          <button type="button" onClick={refresh} className="ml-2 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && events.length === 0 && <EmptyState tab={tab} />}

      {!isLoading &&
        events.map((event) => (
          <ActivityCard
            key={event.cursor_key}
            event={event}
            isMineTab={isMineTab}
            onViewPin={onViewPin}
            onOpenProfile={onOpenProfile}
          />
        ))}

      {!isLoading && hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={isLoadingMore}
          className="w-full rounded-2xl border border-neutral-200 bg-white py-2.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          {isLoadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

// ─── Main Sidebar ──────────────────────────────────────────────────────────────

export interface FeedSidebarProps {
  open: boolean;
  onClose: () => void;
  onViewPin: (pinId: string) => void;
  onOpenProfile: (userId: string) => void;
}

export function FeedSidebar({ open, onClose, onViewPin, onOpenProfile }: FeedSidebarProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("mine");

  return (
    <MapSidebarShell
      open={open}
      title="Activity"
      description={activeTab === "mine" ? "Your actions and follow updates." : "What your network has been up to."}
      onClose={onClose}
      size="default"
      side="left"
    >
      <div className="pb-4">
        <TabBar active={activeTab} onChange={setActiveTab} />
        {/* Render both panels but only show the active one.
            This keeps each tab's hook alive so switching is instant. */}
        <div className={activeTab === "mine" ? "" : "hidden"}>
          <TabPanel tab="mine" onViewPin={onViewPin} onOpenProfile={onOpenProfile} />
        </div>
        <div className={activeTab === "network" ? "" : "hidden"}>
          <TabPanel tab="network" onViewPin={onViewPin} onOpenProfile={onOpenProfile} />
        </div>
      </div>
    </MapSidebarShell>
  );
}
