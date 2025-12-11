import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // Для работы с cookies
});

// Флаг, чтобы не устраивать бесконечные редиректы при серии 401
let isRedirectingToLogin = false;

// Interceptor для добавления токена в заголовки
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обработки ошибок 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // Если уже находимся в процессе редиректа или на странице логина – не дергаем еще раз
      if (!isRedirectingToLogin && window.location.pathname !== "/login") {
        isRedirectingToLogin = true;
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  },
);



