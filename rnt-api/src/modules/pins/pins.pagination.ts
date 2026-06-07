import type { PinPageInput } from "./pins.types";

const DEFAULT_PIN_PAGE_LIMIT = 50;
const MAX_PIN_PAGE_LIMIT = 100;
const NULL_SCORE_CURSOR_VALUE = -2147483648;

type PinPageRow = {
  id: number | string;
  score?: number | null;
  created_at?: string | Date | null;
};

function clampPinPageLimit(limit?: number) {
  if (!Number.isFinite(limit) || !limit || limit <= 0) {
    return DEFAULT_PIN_PAGE_LIMIT;
  }

  return Math.min(Math.floor(limit), MAX_PIN_PAGE_LIMIT);
}

function getCursorScoreValue(score?: number | null) {
  return score == null ? NULL_SCORE_CURSOR_VALUE : score;
}

function encodePinCursor(pin: PinPageRow) {
  return Buffer.from(
    JSON.stringify({
      score: getCursorScoreValue(pin.score),
      created_at:
        pin.created_at instanceof Date
          ? pin.created_at.toISOString()
          : pin.created_at,
      id: Number(pin.id),
    }),
  ).toString("base64url");
}

function decodePinCursor(cursor?: string | null) {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    const score = Number(parsed?.score);
    const id = Number(parsed?.id);
    const createdAt = typeof parsed?.created_at === "string"
      ? parsed.created_at
      : null;

    if (Number.isFinite(score) && Number.isInteger(id) && createdAt) {
      return { score, created_at: createdAt, id };
    }
  } catch {
    return null;
  }

  return null;
}

export function parsePinPageQuery(query: {
  cursor?: unknown;
  limit?: unknown;
}): PinPageInput {
  const limit =
    typeof query.limit === "string" ? parseInt(query.limit, 10) : undefined;

  return {
    cursor: typeof query.cursor === "string" ? query.cursor : null,
    limit: Number.isFinite(limit) && limit && limit > 0 ? limit : undefined,
  };
}

export function preparePinPage(input: PinPageInput) {
  return {
    cursor: decodePinCursor(input.cursor),
    limit: clampPinPageLimit(input.limit),
  };
}

export function buildPinPage<T extends PinPageRow>(rows: T[], limit: number) {
  const pins = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const lastPin = pins[pins.length - 1];

  return {
    pins,
    next_cursor: hasMore && lastPin ? encodePinCursor(lastPin) : null,
    has_more: hasMore,
  };
}
