/**
 * Форма входа
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../entities/user/store.js";
import { authApi } from "./api.js";
import { Button } from "../../shared/ui/Button.js";
import { Card } from "../../shared/ui/Card.js";

export const LoginForm = ({ onClose }: { onClose?: () => void }) => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });
      login(response.user, response.tokens);

      // Редирект в зависимости от роли
      if (response.user.role === "admin") {
        navigate("/admin");
      } else if (response.user.role === "mechanic") {
        navigate("/mechanic");
      } else {
        navigate("/client");
      }

      onClose?.();
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка при входе");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="glass" className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gradient mb-2">Вход</h2>
          <p className="text-dark-300">Войдите в свой аккаунт AutoTrack</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" variant="gradient" className="w-full" isLoading={isLoading}>
            Войти
          </Button>
        </form>

        <div className="text-center text-sm text-dark-400">
          <p>Тестовые аккаунты:</p>
          <div className="mt-2 space-y-1 text-xs">
            <p>Админ: admin@autotrack.local / password123</p>
            <p>Клиент: client@autotrack.local / password123</p>
            <p>Механик: mechanic@autotrack.local / password123</p>
          </div>
        </div>
      </div>
    </Card>
  );
};




