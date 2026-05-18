// src/types/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
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

export enum Role {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  EMPLOYEE = "employee",
  CUSTOMER = "customer",
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
  PREFER_NOT_TO_SAY = "Prefer not to say",
}

export interface CreateUserProfileDto {
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  phone?: string;
  gender?: string;
  avatarUrl: string;
  metadata?: Record<string, any>;
  userName?: string;
}

export interface CreateUserDto {
  email?: string;
  password: string;
  roles?: Role[];
  isActive?: boolean;
  profile?: CreateUserProfileDto;
}

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  phone?: string;
  gender?: string;
  avatarUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedtAt: string;
  employee_number?: string;
  userName?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
}

export interface UpdateUserDto {
  id?: string;
  email?: string;
  roles?: string[];
  isActive?: boolean;
  profile?: UserProfile;
  password?: string;
}

export interface UsersQueryFilterDto {
  isActive?: boolean;
  roles?: Role[];
  page?: number;
  limit?: number;
}

export interface UsersQueryFilterMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface UsersQueryFilterResponse {
  items: UserResponse[];
  meta: UsersQueryFilterMeta;
}
