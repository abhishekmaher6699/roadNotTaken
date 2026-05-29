import type { Pin } from "./types";

export function getPinAuthorName(pin: Pick<Pin, "author" | "posted_by">) {
  return pin.author?.display_name || pin.author?.username || "Anonymous";
}

export function getPinAuthorId(pin: Pick<Pin, "author" | "user_id">) {
  return pin.author?.id || pin.user_id || null;
}

export function getPinAuthorAvatarUrl(pin: Pick<Pin, "author">) {
  return pin.author?.avatar_url || null;
}

export function getAuthorInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}
