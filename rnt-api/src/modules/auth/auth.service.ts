import { getSupabaseClient } from "../../config/supabase"

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

export async function loginUser(email: string, password: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  return data;
}

export async function getUserFromAccessToken(accessToken: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error("Invalid token");
  }

  return data.user;
}

export async function logoutUser(token: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.admin.signOut(token);

  if (error) {
    throw new Error(error.message);
  }
}

export function getGoogleAuthUrl() {
  if (!process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not defined");
  }

  const webUrl = process.env.WEB_URL || "http://localhost:3000";
  const callbackUrl = new URL("/auth/callback", webUrl);
  const authorizeUrl = new URL("/auth/v1/authorize", process.env.SUPABASE_URL);

  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", callbackUrl.toString());

  return authorizeUrl.toString();
}
