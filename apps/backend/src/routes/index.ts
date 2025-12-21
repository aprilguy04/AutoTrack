import type { Express } from "express";

import { adminRouter } from "../modules/admin/admin.router.js";
import { authRouter } from "../modules/auth/auth.router.js";
import { catalogRouter } from "../modules/catalog/catalog.router.js";
import { inventoryRouter } from "../modules/inventory/inventory.router.js";
import { warehouseRouter } from "../modules/inventory/warehouse.router.js";
import { notificationsRouter } from "../modules/notifications/notifications.router.js";
import { ordersRouter } from "../modules/orders/orders.router.js";
import { progressRouter } from "../modules/progress/progress.router.js";
import { stagesRouter } from "../modules/stages/stages.router.js";
import { vehiclesRouter } from "../modules/vehicles/vehicles.router.js";

export const registerRoutes = (app: Express) => {
  // Публичные роуты
  app.use("/api/auth", authRouter);
  app.use("/api/vehicles", vehiclesRouter); // Публичный доступ к каталогу автомобилей
  
  // Защищенные роуты
  app.use("/api/catalog", catalogRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/stages", stagesRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/warehouse", warehouseRouter); // Управление складом (только админ)
  app.use("/api/admin", adminRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/notifications", notificationsRouter);
};

