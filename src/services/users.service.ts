import { http } from "@/lib/http";
import type {
  CreateUserDto,
  UpdateUserDto,
  UserResponse,
  UsersQueryFilterDto,
  UsersQueryFilterResponse,
} from "@/types/auth";

export const usersService = {
  async getAllUsers(): Promise<UserResponse[]> {
    const { data } = await http.get<UserResponse[]>("/users");
    return data;
  },

  async getFilteredUsers(queryFilter: UsersQueryFilterDto) {
    try {
      console.log("[USERS] → POST", `${http.defaults.baseURL}/users/filter`, "payload:", JSON.parse(JSON.stringify(queryFilter)));
      const response = await http.post<UsersQueryFilterResponse>(
        "/users/filter",
        queryFilter,
      );
      const { data } = response;
      console.log("[USERS] ← status:", response.status, "| items:", data?.items?.length, "| meta:", data?.meta);
      console.log("[USERS] ← respuesta cruda:", data);
      return {
        data: data.items,
        meta: data.meta,
      };
    } catch (error) {
      console.error("[USERS] ✖ falló /users/filter", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        code: error?.code,
      });
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  async createUser(payload: CreateUserDto): Promise<UserResponse> {
    try {
      const { data } = await http.post<UserResponse>("/users", payload);
      return data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await http.delete(`/users/${id}`);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  async switchStatus(uuid: string, activate: boolean): Promise<UserResponse> {
    try {
      const { data } = await http.patch<UserResponse>(`/users/${uuid}`, {
        isActive: activate,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  async getOneUser(id: string): Promise<UserResponse | undefined> {
    try {
      const { data } = await http.get<UserResponse>(`/users/${id}`);
      return data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  async updateUser(uuid: string, payload: UpdateUserDto): Promise<UserResponse> {
    try {
      const { data } = await http.patch<UserResponse>(`/users/${uuid}`, payload);
      return data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
};
