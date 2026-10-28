// src/types/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

/** Payload de `POST /auth/login/web` — el front web autentica por employee_number. */
export interface LoginWebRequest {
  employeeNumber: string;
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
  /** Identificador con el que el usuario inicia sesión en el front web. */
  employee_number?: string;
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
  /** Número de empleado EXTERNO (app de RR. HH.). Opcional y único. No es el del NIO. */
  external_employee_number?: string;
  /** Modo vinculado NIO + Activity Report. */
  activity_linked?: boolean;
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
  updatedAt: string;
  /** Número del NIO: lo genera el servidor y es el ID de inicio de sesión. */
  employee_number?: string;
  /** Número de empleado EXTERNO (app de RR. HH.); null/ausente si no tiene. */
  external_employee_number?: string | null;
  /** Modo vinculado: NIO y Activity Report se usan en conjunto (ver ficha del usuario). */
  activity_linked?: boolean;
  /** SOLO dev/pruebas: muestra el bot de actividad en la app NIO del usuario (switch solo para super_admin). */
  dev_activity_bot?: boolean;
  /** Abre la ventana de DevTools en la app NIO del usuario, en tiempo real (switch para super_admin y admin). */
  devtools_enabled?: boolean;
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

/**
 * Campos del perfil que el cliente puede modificar.
 *
 * `id`, `createdAt` y `updatedAt` los gestiona el servidor. `employee_number`
 * (el del NIO) lo genera el backend y es la credencial de acceso: no se edita.
 * `external_employee_number` sí se captura a mano; vacío lo borra.
 */
export type UpdateUserProfileDto = Omit<
  Partial<UserProfile>,
  "id" | "createdAt" | "updatedAt" | "employee_number"
>;

export interface UpdateUserDto {
  id?: string;
  email?: string;
  roles?: string[];
  isActive?: boolean;
  profile?: UpdateUserProfileDto;
  password?: string;
}

/** Campos por los que el backend admite ordenar la lista de usuarios. */
export type UserSortField =
  | "createdAt"
  | "email"
  | "isActive"
  | "firstName"
  | "lastName"
  | "employee_number";

export interface UsersQueryFilterDto {
  isActive?: boolean;
  roles?: Role[];
  /** Búsqueda libre sobre email, nombre, apellido, username y employee number. */
  search?: string;
  sortBy?: UserSortField;
  sortDir?: "asc" | "desc";
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
