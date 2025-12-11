/**
 * Роутер для работы с комплектующими в заказах
 */
import { Router } from "express";
import { z } from "zod";
import { inventoryService } from "./inventory.service.js";
import { authenticateToken, requireRole } from "../../middleware/auth.middleware.js";
import { ordersService } from "../orders/orders.service.js";

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

const addItemSchema = z.object({
  inventoryItemId: z.string(),
  quantity: z.number().int().min(1),
});

/**
 * POST /api/inventory/orders/:orderId/items - Добавить комплектующее в заказ
 */
router.post("/orders/:orderId/items", async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;
    const data = addItemSchema.parse(req.body);

    // Проверяем, что заказ принадлежит клиенту
    const order = await ordersService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ message: "Заказ не найден" });
      return;
    }

    if (order.customerId !== userId && req.user!.role !== "admin") {
      res.status(403).json({ message: "Нет доступа к этому заказу" });
      return;
    }

    const item = await inventoryService.addItemToOrder(orderId, data.inventoryItemId, data.quantity);
    res.status(201).json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Add item to order error:", error);
    res.status(500).json({ message: error.message || "Ошибка при добавлении комплектующего" });
  }
});

/**
 * GET /api/inventory/orders/:orderId/items - Получить комплектующие заказа
 */
router.get("/orders/:orderId/items", async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    // Проверяем доступ к заказу
    const order = await ordersService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ message: "Заказ не найден" });
      return;
    }

    if (order.customerId !== userId && req.user!.role !== "admin" && req.user!.role !== "mechanic") {
      res.status(403).json({ message: "Нет доступа к этому заказу" });
      return;
    }

    const items = await inventoryService.getOrderItems(orderId);
    res.json({ items });
  } catch (error: any) {
    console.error("Get order items error:", error);
    res.status(500).json({ message: "Ошибка при получении комплектующих" });
  }
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

/**
 * PATCH /api/inventory/orders/:orderId/items/:itemId - Обновить количество комплектующего
 */
router.patch("/orders/:orderId/items/:itemId", async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const userId = req.user!.id;
    const data = updateItemSchema.parse(req.body);

    // Проверяем доступ к заказу
    const order = await ordersService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ message: "Заказ не найден" });
      return;
    }

    if (order.customerId !== userId && req.user!.role !== "admin") {
      res.status(403).json({ message: "Нет доступа к этому заказу" });
      return;
    }

    const item = await inventoryService.updateItemQuantity(orderId, itemId, data.quantity);
    res.json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Update item quantity error:", error);
    res.status(500).json({ message: error.message || "Ошибка при обновлении количества" });
  }
});

/**
 * DELETE /api/inventory/orders/:orderId/items/:itemId - Удалить комплектующее из заказа
 */
router.delete("/orders/:orderId/items/:itemId", async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const userId = req.user!.id;

    // Проверяем доступ к заказу
    const order = await ordersService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ message: "Заказ не найден" });
      return;
    }

    if (order.customerId !== userId && req.user!.role !== "admin") {
      res.status(403).json({ message: "Нет доступа к этому заказу" });
      return;
    }

    await inventoryService.removeItemFromOrder(orderId, itemId);
    res.json({ message: "Комплектующее удалено из заказа" });
  } catch (error: any) {
    console.error("Remove item from order error:", error);
    res.status(500).json({ message: "Ошибка при удалении комплектующего" });
  }
});

export const inventoryRouter = router;



