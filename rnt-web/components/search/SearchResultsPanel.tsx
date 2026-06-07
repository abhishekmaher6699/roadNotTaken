"use client";

import { useState } from "react";
import { MapSidebarShell } from "@/components/map/sidebar/MapSidebarShell";
import { Pin } from "@/features/pins";
import {
  getAuthorInitial,
  getPinAuthorAvatarUrl,
  getPinAuthorId,
  getPinAuthorName,
} from "@/features/pins/author";
import type { ProfileSearchResult } from "@/features/profiles";
import { highlight } from "@/components/search/highlight";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

interface SearchResultsPanelProps {
  open: boolean;
  query: string;
  results: Pin[];
  userResults: ProfileSearchResult[];
  isSearching: boolean;
  onSelect: (pin: Pin) => void;
  onSelectUser: (user: ProfileSearchResult) => void;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  general:      "#6b7280",
  food:         "#f59e0b",
  nature:       "#22c55e",
  history:      "#a78bfa",
  culture:      "#ec4899",
  architecture: "#3b82f6",
  viewpoint:    "#f97316",
};

function getCategoryColor(category?: string | null) {
  return CATEGORY_COLORS[category ?? ""] ?? "#6b7280";
}

export function SearchResultsPanel({
  open,
  query,
  results,
  userResults,
  isSearching,
  onSelect,
  onSelectUser,
  onClose,
}: SearchResultsPanelProps) {
  const [pinsOpen, setPinsOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);
  const hasResults = results.length > 0 || userResults.length > 0;

  return (
    <MapSidebarShell
      open={open}
      title="Search Results"
      description={query ? `Showing matches for "${query}"` : "Search to explore pins"}
      onClose={onClose}
      size="wide"
    >
      <div className="space-y-3 pb-4">
        {isSearching && !hasResults && (
          <div className="flex flex-col items-center justify-center space-y-3 py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
            <p className="text-sm font-medium text-neutral-500">
              Searching the map...
            </p>
          </div>
        )}

        {!isSearching && !hasResults && query && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-lg font-semibold text-neutral-800">No matches found</p>
            <p className="mt-1 text-sm text-neutral-500">
              We could not find pins or users matching &ldquo;{query}&rdquo;.
            </p>
          </div>
        )}

        {hasResults && (
          <>
            <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <button
                type="button"
                onClick={() => setPinsOpen((value) => !value)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
              >
                <span className="text-sm font-semibold text-neutral-950">
                  Pins
                </span>
                <span className="text-xs font-semibold text-neutral-500">
                  {results.length}
                </span>
              </button>

              {pinsOpen && (
                <div className="grid grid-cols-1 gap-2.5 border-t border-neutral-100 p-3 sm:grid-cols-2">
                  {results.length === 0 ? (
                    <p className="text-sm text-neutral-500">No pin matches.</p>
                  ) : (
                    results.map((pin) => {
                      const authorName = getPinAuthorName(pin);
                      const authorId = getPinAuthorId(pin);
                      const authorAvatarUrl = getPinAuthorAvatarUrl(pin);

                      return (
                        <div
                          key={pin.id}
                          className="group relative flex flex-col items-start gap-2.5 rounded-2xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md sm:p-3.5"
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(pin)}
                            className="flex w-full items-start justify-between gap-2 text-left"
                          >
                            <div className="flex min-w-0 flex-1 flex-col">
                              <p className="truncate text-[15px] font-semibold leading-5 text-neutral-900 group-hover:text-neutral-950">
                                {highlight(pin.title, query).map((seg, idx) =>
                                  seg.highlight ? (
                                    <mark key={idx} className="rounded bg-amber-100 px-0.5 font-bold text-neutral-950">{seg.text}</mark>
                                  ) : (
                                    <span key={idx}>{seg.text}</span>
                                  )
                                )}
                              </p>
                              {pin.address && (
                                <p className="mt-0.5 truncate text-xs leading-5 text-neutral-500">
                                  {highlight(pin.address, query).map((seg, idx) =>
                                    seg.highlight ? (
                                      <mark key={idx} className="rounded bg-amber-50 px-0.5 font-semibold text-neutral-600">{seg.text}</mark>
                                    ) : (
                                      <span key={idx}>{seg.text}</span>
                                    )
                                  )}
                                </p>
                              )}

                              {pin.category && (
                                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-neutral-500">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: getCategoryColor(pin.category) }}
                                  />
                                  {pin.category}
                                </span>
                              )}
                            </div>
                          </button>

                          <div className="mt-auto flex w-full flex-wrap items-center gap-1.5 pt-1.5">
                            <div className="flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                              {pin.likes_count} likes
                            </div>
                            <div className="flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              {pin.visits_count} visits
                            </div>
                            {authorId ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectUser({
                                    user_id: authorId,
                                    username: pin.author?.username ?? null,
                                    display_name: pin.author?.display_name ?? null,
                                    bio: null,
                                    avatar_url: authorAvatarUrl,
                                    location: null,
                                    total_karma: 0,
                                    pin_count: 0,
                                    comment_count: 0,
                                  })
                                }
                                className="min-w-0 flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500"
                              >
                                {authorAvatarUrl ? (
                                  <img
                                    src={getOptimizedCloudinaryUrl(authorAvatarUrl, "avatar") ?? authorAvatarUrl}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[9px] font-semibold text-white">
                                    {getAuthorInitial(authorName)}
                                  </span>
                                )}
                                <span className="truncate border-b border-transparent transition hover:border-neutral-600">
                                  {authorName}
                                </span>
                              </button>
                            ) : (
                              <div className="min-w-0 flex items-center gap-1 text-[11px] text-neutral-400">
                                <span>by {authorName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <button
                type="button"
                onClick={() => setUsersOpen((value) => !value)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
              >
                <span className="text-sm font-semibold text-neutral-950">
                  Users
                </span>
                <span className="text-xs font-semibold text-neutral-500">
                  {userResults.length}
                </span>
              </button>

              {usersOpen && (
                <div className="grid grid-cols-1 gap-2.5 border-t border-neutral-100 p-3 sm:grid-cols-2">
                  {userResults.length === 0 ? (
                    <p className="text-sm text-neutral-500">No user matches.</p>
                  ) : (
                    userResults.map((user) => {
                      const name = user.display_name || user.username || "Anonymous";
                      return (
                        <button
                          key={user.user_id}
                          type="button"
                          onClick={() => onSelectUser(user)}
                          className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                        >
                          {user.avatar_url ? (
                            <img
                              src={getOptimizedCloudinaryUrl(user.avatar_url, "avatar") ?? user.avatar_url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-11 w-11 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-neutral-950">
                              {name}
                            </p>
                            <p className="truncate text-xs text-neutral-500">
                              {user.username ? `@${user.username}` : "Road Not Taken member"}
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-neutral-400">
                              {user.total_karma.toLocaleString()} karma -{" "}
                              {user.pin_count.toLocaleString()} pins
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MapSidebarShell>
  );
}
