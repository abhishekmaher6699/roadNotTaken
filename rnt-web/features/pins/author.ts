import type { Pin } from "./types";

export function getPinAuthorName(pin: Pick<Pin, "author" | "posted_by">) {
  return pin.author?.display_name || pin.author?.username || "Anonymous";
}
