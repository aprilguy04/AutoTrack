/**
 * Store для управления состоянием аутентификации
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens } from "./types.js";
import { api } from "../../shared/api/client.js";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCheckedAuth: boolean; // Флаг, что проверка уже была выполнена

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      hasCheckedAuth: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (tokens) => {
        set({ tokens });
        if (tokens?.accessToken) {
          localStorage.setItem("accessToken", tokens.accessToken);
          if (tokens.refreshToken) {
            localStorage.setItem("refreshToken", tokens.refreshToken);
          }
        }
      },

      login: (user, tokens) => {
        set({
          user,
          tokens,
          isAuthenticated: true,
        });
        localStorage.setItem("accessToken", tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem("refreshToken", tokens.refreshToken);
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (error) {
          // Игнорируем ошибки при выходе
        }
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          hasCheckedAuth: false, // Сбрасываем флаг при выходе
        });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      },

      checkAuth: async () => {
        const state = get();
        
        // Если проверка уже была выполнена, не делаем повторный запрос
        if (state.hasCheckedAuth) {
          // Но если isLoading все еще true, сбрасываем его
          if (state.isLoading) {
            set({ isLoading: false });
          }
          return;
        }

        set({ isLoading: true });
        
        // Таймаут для защиты от зависания
        const timeoutId = setTimeout(() => {
          const currentState = get();
          if (currentState.isLoading && !currentState.hasCheckedAuth) {
            console.warn("checkAuth timeout, setting isLoading to false");
            set({ 
              isLoading: false, 
              hasCheckedAuth: true,
            });
          }
        }, 10000); // 10 секунд таймаут

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            clearTimeout(timeoutId);
            set({ 
              isLoading: false, 
              isAuthenticated: false, 
              user: null, 
              tokens: null,
              hasCheckedAuth: true,
            });
            return;
          }

          const response = await api.get("/auth/me");
          clearTimeout(timeoutId);
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
            hasCheckedAuth: true,
          });
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("checkAuth error:", error);
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            hasCheckedAuth: true,
          });
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        hasCheckedAuth: state.hasCheckedAuth,
      }),
    },
  ),
);

