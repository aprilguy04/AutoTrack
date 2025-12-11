/**
 * Компонент для защиты роутов на основе ролей
 */
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../entities/user/store.js";
import type { UserRole } from "../../entities/user/types.js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-dark-400">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-dark-50">Доступ запрещен</h2>
          <p className="text-dark-400">
            У вас нет прав для доступа к этой странице.
          </p>
          <p className="text-sm text-dark-500">
            Требуемая роль: {allowedRoles.join(" или ")}
            <br />
            Ваша роль: {user.role}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};




