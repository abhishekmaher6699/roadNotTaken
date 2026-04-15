import {
  createSessionApi,
  getGoogleAuthUrlApi,
  loginApi,
  logoutApi,
  signupApi,
} from "../../features/auth/api";
import { getOAuthHashParams } from "@/lib/auth";

export function useAuth() {
  const login = async (email: string, password: string) => {
    return loginApi(email, password);
  };

  const signup = async (email: string, password: string) => {
    return signupApi(email, password);
  };

  const loginWithGoogle = async () => {
    const data = await getGoogleAuthUrlApi();
    window.location.assign(data.url);
  };

  const completeGoogleOAuth = async () => {
    const hashParams = getOAuthHashParams();
    const error = hashParams.get("error_description") ?? hashParams.get("error");

    if (error) {
      throw new Error(error);
    }

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken) {
      throw new Error("Google login did not return an access token");
    }

    await createSessionApi({
      access_token: accessToken,
      refresh_token: refreshToken ?? undefined,
    });

    if (typeof window !== "undefined") {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
    }
  };

  const logout = async () => {
    await logoutApi();
  };

  return { login, signup, loginWithGoogle, completeGoogleOAuth, logout };
}
