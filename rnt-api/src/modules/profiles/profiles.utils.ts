import type { UpdateProfileInput } from "./profiles.types";

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "login",
  "logout",
  "me",
  "profile",
  "profiles",
  "signup",
  "support",
]);

export class ProfilesServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ProfilesServiceError";
  }
}
export function optionalText(value: unknown, maxLength: number, field: string) {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new ProfilesServiceError(`${field} must be text`, 400);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw new ProfilesServiceError(`${field} is too long`, 400);
  }

  return trimmed;
}

function normalizeUsername(value: unknown) {
  const username = optionalText(value, 32, "username")?.toLowerCase() ?? null;

  if (!username) return null;
  if (!/^[a-z0-9_-]+$/.test(username)) {
    throw new ProfilesServiceError("username contains invalid characters", 400);
  }
  if (RESERVED_USERNAMES.has(username)) {
    throw new ProfilesServiceError("username is reserved", 400);
  }

  return username;
}

function normalizeWebsite(value: unknown) {
  const website = optionalText(value, 160, "website");
  if (!website) return null;

  try {
    const url = new URL(website);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    return url.toString();
  } catch {
    throw new ProfilesServiceError("website must be a valid URL", 400);
  }
}

function normalizeAvatarUrl(value: unknown) {
  const avatarUrl = optionalText(value, 500, "avatar_url");
  if (!avatarUrl) return null;

  try {
    const url = new URL(avatarUrl);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      throw new Error("Untrusted avatar URL");
    }
    return url.toString();
  } catch {
    throw new ProfilesServiceError("avatar_url must be a trusted upload URL", 400);
  }
}

export function normalizeProfileInput(input: UpdateProfileInput) {
  return {
    username: normalizeUsername(input.username),
    display_name: optionalText(input.display_name, 40, "display_name"),
    bio: optionalText(input.bio, 240, "bio"),
    avatar_url: normalizeAvatarUrl(input.avatar_url),
    location: optionalText(input.location, 80, "location"),
    website: normalizeWebsite(input.website),
  };
}

export default function hasOwn(input: UpdateProfileInput, key: keyof UpdateProfileInput) {
  return Object.prototype.hasOwnProperty.call(input, key);
}
