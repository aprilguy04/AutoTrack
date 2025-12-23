import { Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AdminPage } from "./pages/AdminPage.tsx";
import { ClientDashboardPage } from "./pages/ClientDashboardPage.tsx";
import { CreateOrderPage } from "./pages/CreateOrderPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { MechanicPage } from "./pages/MechanicPage.tsx";
import { WarehousePage } from "./pages/WarehousePage.tsx";
import { Navbar } from "./shared/ui/Navbar.tsx";
import { useAuthStore } from "./entities/user/store.js";
import { ProtectedRoute } from "./shared/components/ProtectedRoute.tsx";

const App = () => {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // Вызываем checkAuth только один раз при монтировании
    console.log("App mounted, calling checkAuth");
    checkAuth().catch((error) => {
      console.error("checkAuth failed:", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив зависимостей - выполнится только при монтировании

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dark-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={["client", "admin"]}>
                <ClientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/orders/new"
            element={
              <ProtectedRoute allowedRoles={["client", "admin"]}>
                <CreateOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mechanic"
            element={
              <ProtectedRoute allowedRoles={["mechanic", "admin"]}>
                <MechanicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/warehouse"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <WarehousePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;


