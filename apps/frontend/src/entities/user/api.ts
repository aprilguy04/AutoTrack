import { api } from "../../shared/api/client.js";
import type { User } from "./types.js";

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  updateProfile: async (data: UpdateProfileData): Promise<{ user: User }> => {
    const response = await api.patch("/auth/profile", data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.post("/auth/change-password", data);
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete("/auth/account");
  },
};
