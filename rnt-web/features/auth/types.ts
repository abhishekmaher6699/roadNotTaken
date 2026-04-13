export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthSession {
  access_token: string;
}

export interface AuthResponse {
  message: string;
  session: AuthSession;
  user: AuthUser;
}

export interface SignupResponse {
  message: string;
  user: AuthUser;
}
