import { Link, useLocation, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { useState } from "react";
import { useAuthStore } from "../../entities/user/store.js";
import { Button } from "./Button.js";
import { AuthModal } from "../../widgets/AuthModal.js";
import { NotificationsBell } from "../../features/notifications/components/NotificationsBell.tsx";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Определяем доступные ссылки в зависимости от роли
  const getLinks = () => {
    if (!isAuthenticated || !user) {
      return [{ to: "/", label: "Главная" }];
    }

    const baseLinks = [{ to: "/", label: "Главная" }];

    if (user.role === "client") {
      baseLinks.push({ to: "/client", label: "Мои заказы" });
    } else if (user.role === "mechanic") {
      baseLinks.push({ to: "/mechanic", label: "Задачи" });
    } else if (user.role === "admin") {
      baseLinks.push({ to: "/admin", label: "Панель" });
    }

    return baseLinks;
  };

  const links = getLinks();

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-dark-700/50 shadow-2xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 via-accent-500 to-primary-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-primary-400/30">
                <span className="text-white font-bold text-2xl">🔧</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-gradient leading-tight">AutoTrack</span>
                <span className="text-xs text-dark-400 font-medium -mt-1">Service Tracker</span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={clsx("nav-link", isActive && "active")}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <NotificationsBell />
                  <span className="text-sm text-dark-300">
                    {user.fullName}
                    <span className="ml-2 text-xs text-primary-400">({user.role})</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Выйти
                  </Button>
                </div>
              ) : (
                <Button variant="gradient" size="sm" onClick={() => setIsAuthModalOpen(true)}>
                  Войти
                </Button>
              )}
            </div>
          </div>
        </nav>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </>
  );
};

