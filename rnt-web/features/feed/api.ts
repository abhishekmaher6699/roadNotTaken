import { apiClient } from "@/lib/api-client";
import type { FeedPage, FeedTab } from "./types";

export function getFeedApi(
  tab: FeedTab,
  cursor?: string | null,
  limit: number = 20,
): Promise<FeedPage> {
  const params = new URLSearchParams();

  params.set("tab", tab);

  if (cursor) {
    params.set("cursor", cursor);
  }

  params.set("limit", String(limit));

  return apiClient(`/feed?${params.toString()}`) as Promise<FeedPage>;
}
