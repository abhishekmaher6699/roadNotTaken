export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
}

export interface SignupResponse {
  message: string;
  user: AuthUser;
}

export interface GoogleAuthUrlResponse {
  url: string;
}

export interface CreateSessionInput {
  access_token: string;
  refresh_token?: string;
}
