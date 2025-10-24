// src/types/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Expiración del access en segundos (ej. 900 = 15m) */
  expiresIn: number;
}

export interface UserDto {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  // Perfil opcional (ajusta a tu backend si cambian los nombres)
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface AuthResponseDto {
  user: UserDto;
  tokens: TokensDto;
}

/** Si usas /users/me que devuelve el usuario actual */
export type MeResponse = UserDto;
