export function formatDate(date?: string | null) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
}

export function formatDay(date?: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}
