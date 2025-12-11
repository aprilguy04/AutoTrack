/**
 * Форма регистрации
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "./api.js";
import { useAuthStore } from "../../entities/user/store.js";
import { Button } from "../../shared/ui/Button.js";
import { Card } from "../../shared/ui/Card.js";

export const RegisterForm = ({ onClose }: { onClose?: () => void }) => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
      });

      // После регистрации автоматически логиним пользователя
      const loginResponse = await authApi.login({
        email: formData.email,
        password: formData.password,
      });
      
      login(loginResponse.user, loginResponse.tokens);

      // Редирект в зависимости от роли
      if (loginResponse.user.role === "admin") {
        navigate("/admin");
      } else if (loginResponse.user.role === "mechanic") {
        navigate("/mechanic");
      } else {
        navigate("/client");
      }

      onClose?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Ошибка при регистрации";
      const errors = err.response?.data?.errors;
      if (errors) {
        setError(errors.map((e: any) => e.message).join(", "));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="glass" className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gradient mb-2">Регистрация</h2>
          <p className="text-dark-300">Создайте новый аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-dark-300 mb-2">
              ФИО
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-dark-300 mb-2">
              Телефон (необязательно)
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="+375291234567"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Минимум 6 символов"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300 mb-2">
              Подтвердите пароль
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Повторите пароль"
            />
          </div>

          <Button type="submit" variant="gradient" className="w-full" isLoading={isLoading}>
            Зарегистрироваться
          </Button>
        </form>
      </div>
    </Card>
  );
};

