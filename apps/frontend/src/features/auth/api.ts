/**
 * API функции для аутентификации
 */
import { api } from "../../shared/api/client.js";
import type { LoginCredentials, RegisterData, User, AuthTokens } from "../../entities/user/types.js";

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export const authApi = {
  /**
   * Регистрация нового пользователя
   */
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },

  /**
   * Вход в систему
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  /**
   * Выход из системы
   */
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  /**
   * Получение текущего пользователя
   */
  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>("/auth/me");
    return response.data;
  },

  /**
   * Обновление access токена
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post<{ accessToken: string }>("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },
};




