/**
 * Splits `text` into segments, marking which parts match `query`.
 * Returns an array of { text, highlight } objects for rendering.
 *
 * Example: highlight("Shaniwar Wada Fort", "fort")
 *   → [{ text: "Shaniwar Wada ", highlight: false }, { text: "Fort", highlight: true }]
 */
export function highlight(
  text: string,
  query: string
): Array<{ text: string; highlight: boolean }> {
  if (!query.trim() || !text) return [{ text, highlight: false }];

  // Build a case-insensitive regex from the query, escaped for safety.
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");

  const parts = text.split(regex);

  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      highlight: regex.test(part),
    }));
}
