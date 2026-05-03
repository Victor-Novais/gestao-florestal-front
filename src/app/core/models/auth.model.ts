export interface LoginRequest {
  usuario: string;
  senha: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId?: string | null;
  colaboradorId?: string | null;
  username?: string;
  email?: string;
  roles?: string[];
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface AuthMeResponse {
  userId: string;
  colaboradorId?: string | null;
  username: string;
  email: string;
  roles: string[];
}

export interface JwtPayload {
  sub: string;
  role?: string;
  roles?: string;
  exp: number;
  iat: number;
}

export interface CurrentUser {
  userId: string | null;
  colaboradorId: string | null;
  username: string;
  email: string;
  role: 'ROLE_ADMIN' | 'ROLE_COLABORADOR';
}

export type UserRole = CurrentUser['role'];

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}
