import { http } from "@/lib/http";
import type {
  CreateUserDto,
  UpdateUserDto,
  UserResponse,
  UsersQueryFilterDto,
  UsersQueryFilterResponse,
} from "@/types/auth";

export const usersService = {
  async getAllUsers() {
    try {
      const response = await http.get<UserResponse[]>("/users");

      const { data } = response;

      console.log(data);

      return data;
    } catch (error) {
      console.error("Error fetching users data", error);
    }
  },

  async getFilteredUsers(queryFilter: UsersQueryFilterDto) {
    console.log("Fetching users with query:", queryFilter);

    try {
      const response = await http.post<UsersQueryFilterResponse>(
        "/users/filter",
        queryFilter,
      );

      const { data } = response;

      console.log(data);

      return {
        data: data.items,
        meta: data.meta,
      };
    } catch (error) {
      console.error("Error fetching users data", error);
    }
  },

  async createUser(payload: CreateUserDto) {
    try {
      const { data } = await http.post<UserResponse>("/users", payload);
      return data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  async deleteUser(id: string) {
    try {
      await http.delete(`/users/${id}`);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  async switchStatus(uuid: string, activate: boolean) {
    try {
      const response = await http.patch(`/users/${uuid}`, {
        isActive: activate,
      });
      console.log(response);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  async getOneUser(id: string) {
    try {
      const response = await http.get<UserResponse>(`/users/${id}`);

      const { data } = response;

      console.log(data);

      return data;
    } catch (error) {
      console.error("Error fetching user data", error);
    }
  },

  async updateUser(uuid: string, payload: UpdateUserDto) {
    try {
      const response = await http.patch(`/users/${uuid}`, payload);
      console.log(response);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
};
