import { getSupabaseClient } from "../../config/supabase";

export interface AuthSessionResult {
  user: {
    id: string;
    email?: string;
  } | null;
  session: {
    access_token: string;
    refresh_token?: string;
    expires_in: number; // ✅ IMPORTANT
  } | null;
}

const DEFAULT_WEB_URL = "http://localhost:3000";

// Creates a confirmed email/password user in Supabase admin auth.
export async function signupUser(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

// Signs in a user and returns the Supabase session payload.
export async function loginUser(email: string, password: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) throw new Error(error?.message || "Login failed");

  return {
    user: data.user,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    },
  };
}

// Verifies an access token and returns the matching Supabase user.
export async function getUserFromAccessToken(accessToken: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error("Invalid token");
  }

  return data.user;
}

// Revokes the current Supabase session.
export async function logoutUser(token: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.admin.signOut(token);

  if (error) {
    throw new Error(error.message);
  }
}

// Refreshes an expired access token using the refresh token.
export async function refreshAccessToken(
  refreshToken: string,
): Promise<Exclude<AuthSessionResult["session"], null>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new Error(error?.message || "Failed to refresh token");
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
  };
}
// Builds the Google auth URL on the server so the frontend only needs to redirect to it.
export function getGoogleAuthUrl() {
  if (!process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not defined");
  }

  const webUrl = process.env.WEB_URL || DEFAULT_WEB_URL;
  const callbackUrl = new URL("/auth/callback", webUrl);
  const authorizeUrl = new URL("/auth/v1/authorize", process.env.SUPABASE_URL);

  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", callbackUrl.toString());
  // Always show the Google account picker — prevents auto-sign-in to the last account.
  authorizeUrl.searchParams.set("prompt", "select_account");

  return authorizeUrl.toString();
}
