/**
 * Роутер для работы с этапами заказа
 */
import { Router } from "express";
import { z } from "zod";
import { stagesService } from "./stages.service.js";
import { authenticateToken, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

/**
 * GET /api/stages/order/:orderId - Получить этапы заказа
 */
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Проверяем доступ к заказу
    const { ordersService } = await import("../../modules/orders/orders.service.js");
    const order = await ordersService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ message: "Заказ не найден" });
      return;
    }

    // Клиент может видеть только свои заказы, механик - назначенные ему, админ - все
    if (userRole === "client" && order.customerId !== userId) {
      res.status(403).json({ message: "Нет доступа к этому заказу" });
      return;
    }

    const stages = await stagesService.getOrderStages(orderId);
    res.json({ stages });
  } catch (error: any) {
    console.error("Get stages error:", error);
    res.status(500).json({ message: "Ошибка при получении этапов" });
  }
});

/**
 * GET /api/stages/assigned - Получить назначенные заказы (для механика)
 */
router.get("/assigned", requireRole("mechanic"), async (req, res) => {
  try {
    const mechanicId = req.user!.id;
    console.log(`Getting assigned orders for mechanic ${mechanicId}`);
    const orders = await stagesService.getAssignedOrders(mechanicId);
    res.json({ orders: orders || [] });
  } catch (error: any) {
    console.error("Get assigned orders error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: "Ошибка при получении назначенных заказов",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/stages/:stageId - Получить этап с деталями
 */
router.get("/:stageId", async (req, res) => {
  try {
    const stage = await stagesService.getStageById(req.params.stageId);
    if (!stage) {
      res.status(404).json({ message: "Этап не найден" });
      return;
    }
    res.json({ stage });
  } catch (error) {
    console.error("Get stage error:", error);
    res.status(500).json({ message: "Ошибка при получении этапа" });
  }
});

const updateStageSchema = z.object({
  status: z.enum(["pending", "in_progress", "done", "blocked"]),
  comment: z.string().optional(),
});

/**
 * PATCH /api/stages/:stageId - Обновить статус этапа (для механика)
 */
router.patch("/:stageId", requireRole("mechanic"), async (req, res) => {
  try {
    const { stageId } = req.params;
    const mechanicId = req.user!.id;
    const data = updateStageSchema.parse(req.body);

    console.log(`Updating stage ${stageId} by mechanic ${mechanicId}`, data);
    const stage = await stagesService.updateStageStatus(stageId, mechanicId, data);
    console.log(`Stage ${stageId} updated successfully`);
    res.json({ stage });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Update stage error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: error.message || "Ошибка при обновлении этапа",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

const addCommentSchema = z.object({
  content: z.string().min(1, "Комментарий не может быть пустым"),
});

/**
 * POST /api/stages/:stageId/comments - Добавить комментарий к этапу
 */
router.post("/:stageId/comments", requireRole("mechanic", "admin"), async (req, res) => {
  try {
    const { stageId } = req.params;
    const authorId = req.user!.id;
    const data = addCommentSchema.parse(req.body);

    const comment = await stagesService.addComment(stageId, authorId, data.content);
    res.status(201).json({ comment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Add comment error:", error);
    res.status(500).json({ message: "Ошибка при добавлении комментария" });
  }
});

const addAttachmentSchema = z.object({
  base64: z.string().min(10),
  fileName: z.string().optional(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});

/**
 * POST /api/stages/:stageId/attachments - Добавить вложение к этапу
 */
router.post("/:stageId/attachments", requireRole("mechanic", "admin"), async (req, res) => {
  try {
    const { stageId } = req.params;
    const data = addAttachmentSchema.parse(req.body);
    const attachment = await stagesService.addAttachment(stageId, req.user!.id, data);
    res.status(201).json({ attachment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }
    console.error("Add attachment error:", error);
    res.status(500).json({ message: error.message || "Ошибка при добавлении файла" });
  }
});

/**
 * POST /api/stages/:stageId/view - Отметить этап просмотренным механиком
 */
router.post("/:stageId/view", requireRole("mechanic"), async (req, res) => {
  try {
    const { stageId } = req.params;
    const mechanicId = req.user!.id;
    await stagesService.markStageViewed(stageId, mechanicId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark stage view error:", error);
    res.status(500).json({ message: error.message || "Ошибка при обновлении этапа" });
  }
});

// ============================================================================
// УПРАВЛЕНИЕ КОМПЛЕКТУЮЩИМИ ДЛЯ КЛИЕНТА
// ============================================================================

/**
 * GET /api/stages/:stageId/inventory - Получить комплектующие этапа (для клиента)
 */
router.get("/:stageId/inventory", async (req, res) => {
  try {
    const { stageId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Проверяем доступ к этапу
    const stage = await stagesService.getStageById(stageId);
    if (!stage) {
      res.status(404).json({ message: "Этап не найден" });
      return;
    }

    // Клиент может видеть только свои заказы
    if (userRole === "client" && stage.order.customer.id !== userId) {
      res.status(403).json({ message: "Нет доступа к этому этапу" });
      return;
    }

    const { prisma } = await import("../../db/prisma.js");
    const items = await prisma.orderStageInventoryItem.findMany({
      where: { orderStageId: stageId },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            subcategory: true,
            sku: true,
            oemNumber: true,
            manufacturer: true,
            price: true,
            stock: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ items });
  } catch (error: any) {
    console.error("Get stage inventory error:", error);
    res.status(500).json({ message: "Ошибка при получении комплектующих" });
  }
});

const respondToInventorySchema = z.object({
  selectedByClient: z.boolean(),
  clientNotes: z.string().optional(),
});

/**
 * PATCH /api/stages/inventory/:itemId/respond - Ответить на предложение комплектующего (для клиента)
 */
router.patch("/inventory/:itemId/respond", requireRole("client", "admin"), async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const data = respondToInventorySchema.parse(req.body);

    const { prisma } = await import("../../db/prisma.js");

    // Получаем комплектующее с этапом и заказом
    const item = await prisma.orderStageInventoryItem.findUnique({
      where: { id: itemId },
      include: {
        orderStage: {
          include: {
            order: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      res.status(404).json({ message: "Комплектующее не найдено" });
      return;
    }

    // Проверяем доступ
    if (userRole === "client" && item.orderStage.order.customer.id !== userId) {
      res.status(403).json({ message: "Нет доступа к этому комплектующему" });
      return;
    }

    const wasApproved = item.selectedByClient === true;
    const isNowApproved = data.selectedByClient;

    // Получаем информацию о комплектующем для проверки остатка
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: item.inventoryItemId },
    });

    if (!inventoryItem) {
      res.status(404).json({ message: "Комплектующее не найдено на складе" });
      return;
    }

    // Логика списания/возврата со склада (только для опциональных комплектующих)
    // Обязательные уже списаны при добавлении админом
    if (!item.isRequired) {
      // Если клиент подтверждает (не было подтверждено ранее) - списываем
      if (isNowApproved && !wasApproved) {
        if (inventoryItem.stock < item.quantity) {
          res.status(400).json({
            message: `Недостаточно товара на складе. Доступно: ${inventoryItem.stock}, требуется: ${item.quantity}`,
          });
          return;
        }
        await prisma.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }
      // Если клиент отклоняет (было подтверждено ранее) - возвращаем на склад
      else if (!isNowApproved && wasApproved) {
        await prisma.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }
    }

    // Обновляем статус
    const updated = await prisma.orderStageInventoryItem.update({
      where: { id: itemId },
      data: {
        selectedByClient: data.selectedByClient,
        clientNotes: data.clientNotes || item.clientNotes,
        status: data.selectedByClient ? "approved" : "rejected",
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            sku: true,
            oemNumber: true,
            manufacturer: true,
            price: true,
            stock: true,
            unit: true,
          },
        },
      },
    });

    res.json({ item: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Respond to inventory error:", error);
    res.status(500).json({ message: "Ошибка при ответе на предложение" });
  }
});

export const stagesRouter = router;

