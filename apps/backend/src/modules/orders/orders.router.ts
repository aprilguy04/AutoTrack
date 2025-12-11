/**
 * Роутер для работы с заказами
 */
import { Router } from "express";
import { z } from "zod";
import { ordersService } from "./orders.service.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

/**
 * GET /api/orders - Получить заказы текущего пользователя
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const orders = await ordersService.getOrdersByCustomer(userId);
    res.json({ orders: orders || [] });
  } catch (error: any) {
    console.error("Get orders error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({ 
      message: "Ошибка при получении заказов",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/orders/:id - Получить заказ по ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const order = await ordersService.getOrderById(id);
    if (!order) {
      res.status(404).json({ message: "Заказ не найден" });
      return;
    }

    // Проверяем, что заказ принадлежит пользователю (или пользователь админ)
    if (order.customerId !== userId && req.user!.role !== "admin") {
      res.status(403).json({ message: "Нет доступа к этому заказу" });
      return;
    }

    res.json({ order });
  } catch (error: any) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Ошибка при получении заказа" });
  }
});

const createOrderSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  vehicleGenerationId: z.string().optional(),
  vehicleYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  vehicleInfo: z.string().optional(),
  serviceType: z.enum(["diagnostics", "repair", "maintenance", "other"]),
  serviceTypeOther: z.string().optional(),
  serviceTemplateId: z.string().optional(),
});

/**
 * POST /api/orders - Создать новый заказ
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const data = createOrderSchema.parse(req.body);

    // Если выбран "other", требуется описание
    if (data.serviceType === "other" && !data.serviceTypeOther) {
      res.status(400).json({ message: "Укажите тип работы" });
      return;
    }

    console.log("Creating order with data:", {
      ...data,
      customerId: userId,
    });

    const order = await ordersService.createOrder({
      ...data,
      customerId: userId,
      serviceTemplateId: data.serviceTemplateId,
    });

    console.log("Order created successfully:", order.id);
    res.status(201).json({ order });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Create order error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    res.status(500).json({ 
      message: "Ошибка при создании заказа",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const ordersRouter = router;



