import { loginApi, signupApi } from "./api";

export function useAuth() {
  const login = async (email: string, password: string) => {
    const data = await loginApi(email, password);

    localStorage.setItem("token", data.session.access_token);

    return data;
  };

  const signup = async (email: string, password: string) => {
    await signupApi(email, password);
    return login(email, password);
  };

  return { login, signup };
}
