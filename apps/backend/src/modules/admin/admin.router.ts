/**
 * Роутер для администратора
 */
import { Router } from "express";
import { z } from "zod";
import { adminService } from "./admin.service.js";
import { authenticateToken, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

// Все роуты требуют аутентификацию и роль администратора
router.use(authenticateToken);
router.use(requireRole("admin"));

/**
 * GET /api/admin/orders - список заказов
 */
router.get("/orders", async (_, res) => {
  try {
    const orders = await adminService.getOrdersOverview();
    res.json({ orders });
  } catch (error) {
    console.error("Get admin orders error:", error);
    res.status(500).json({ message: "Ошибка при загрузке заказов" });
  }
});

router.post("/orders/:orderId/view", async (req, res) => {
  try {
    await adminService.markOrderViewed(req.params.orderId);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark admin order view error:", error);
    res.status(500).json({ message: "Не удалось обновить заказ" });
  }
});

router.get("/mechanics", async (_, res) => {
  try {
    const mechanics = await adminService.getMechanics();
    res.json({ mechanics });
  } catch (error) {
    console.error("Get mechanics error:", error);
    res.status(500).json({ message: "Не удалось загрузить механиков" });
  }
});

const createOrderStageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
  assignedTo: z.string().optional(),
});

router.post("/orders/:orderId/stages", async (req, res) => {
  try {
    const payload = createOrderStageSchema.parse(req.body);
    const stage = await adminService.createOrderStage(req.params.orderId, payload);
    res.status(201).json({ stage });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Create order stage error:", error);
    res.status(500).json({ message: "Не удалось создать этап" });
  }
});

const updateOrderStageSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "done", "blocked"]).optional(),
  orderIndex: z.number().int().min(0).optional(),
  assignedTo: z.string().nullable().optional(),
});

router.patch("/orders/:orderId/stages/:stageId", async (req, res) => {
  try {
    const payload = updateOrderStageSchema.parse(req.body);
    const stage = await adminService.updateOrderStage(req.params.stageId, payload);
    res.json({ stage });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Update order stage error:", error);
    res.status(500).json({ message: "Не удалось обновить этап" });
  }
});

/**
 * DELETE /api/admin/orders/:orderId/stages/:stageId - Удалить этап заказа
 */
router.delete("/orders/:orderId/stages/:stageId", async (req, res) => {
  try {
    await adminService.deleteOrderStage(req.params.stageId);
    res.json({ message: "Этап удалён" });
  } catch (error: any) {
    console.error("Delete order stage error:", error);
    res.status(500).json({ message: error.message || "Не удалось удалить этап" });
  }
});

const reorderStagesSchema = z.object({
  stages: z.array(
    z.object({
      stageId: z.string(),
      orderIndex: z.number().int().min(0),
    }),
  ),
});

router.post("/orders/:orderId/stages/reorder", async (req, res) => {
  try {
    const data = reorderStagesSchema.parse(req.body);
    await adminService.reorderOrderStages(req.params.orderId, data.stages);
    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Reorder stages error:", error);
    res.status(500).json({ message: "Не удалось обновить порядок этапов" });
  }
});

const createStageTemplateSchema = z.object({
  serviceTemplateId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0),
  estimatedHours: z.number().positive().optional(),
  isRequired: z.boolean().optional(),
});

/**
 * POST /api/admin/stage-templates - Создать шаблон этапа
 */
router.post("/stage-templates", async (req, res) => {
  try {
    const data = createStageTemplateSchema.parse(req.body);
    console.log("Creating stage template:", data);
    const template = await adminService.createStageTemplate(data);
    console.log("Stage template created:", template.id);
    res.status(201).json({ template });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Create stage template error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: "Ошибка при создании шаблона этапа",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

const updateStageTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
  estimatedHours: z.number().positive().optional(),
  isRequired: z.boolean().optional(),
});

/**
 * PATCH /api/admin/stage-templates/:id - Обновить шаблон этапа
 */
router.patch("/stage-templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateStageTemplateSchema.parse(req.body);
    const template = await adminService.updateStageTemplate(id, data);
    res.json({ template });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Update stage template error:", error);
    res.status(500).json({ message: "Ошибка при обновлении шаблона этапа" });
  }
});

/**
 * DELETE /api/admin/stage-templates/:id - Удалить шаблон этапа
 */
router.delete("/stage-templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteStageTemplate(id);
    res.json({ message: "Шаблон этапа удален" });
  } catch (error: any) {
    console.error("Delete stage template error:", error);
    res.status(500).json({ message: "Ошибка при удалении шаблона этапа" });
  }
});

const createServiceTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

/**
 * POST /api/admin/service-templates - Создать шаблон услуги
 */
router.post("/service-templates", async (req, res) => {
  try {
    const data = createServiceTemplateSchema.parse(req.body);
    const template = await adminService.createServiceTemplate(data);
    res.status(201).json({ template });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Create service template error:", error);
    res.status(500).json({ message: "Ошибка при создании шаблона услуги" });
  }
});

const updateServiceTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/admin/service-templates/:id - Обновить шаблон услуги
 */
router.patch("/service-templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateServiceTemplateSchema.parse(req.body);
    const template = await adminService.updateServiceTemplate(id, data);
    res.json({ template });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    console.error("Update service template error:", error);
    res.status(500).json({ message: "Ошибка при обновлении шаблона услуги" });
  }
});

/**
 * DELETE /api/admin/service-templates/:id - Удалить шаблон услуги
 */
router.delete("/service-templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteServiceTemplate(id);
    res.json({ message: "Шаблон услуги удален" });
  } catch (error: any) {
    console.error("Delete service template error:", error);
    res.status(500).json({ message: "Ошибка при удалении шаблона услуги" });
  }
});

// ============================================================================
// УПРАВЛЕНИЕ КОМПЛЕКТУЮЩИМИ НА ЭТАПАХ
// ============================================================================

const suggestInventorySchema = z.object({
  inventoryItemId: z.string(),
  quantity: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  adminNotes: z.string().optional(),
});

/**
 * POST /api/admin/order-stages/:stageId/inventory - Предложить комплектующее для этапа
 */
router.post("/order-stages/:stageId/inventory", async (req, res) => {
  try {
    const { stageId } = req.params;
    const data = suggestInventorySchema.parse(req.body);

    const item = await adminService.suggestInventoryForOrderStage({
      orderStageId: stageId,
      ...data,
    });

    res.status(201).json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Suggest inventory error:", error);
    res.status(500).json({ message: error.message || "Ошибка при добавлении комплектующего" });
  }
});

/**
 * GET /api/admin/order-stages/:stageId/inventory - Получить комплектующие этапа
 */
router.get("/order-stages/:stageId/inventory", async (req, res) => {
  try {
    const { stageId } = req.params;
    const items = await adminService.getOrderStageInventoryItems(stageId);
    res.json({ items });
  } catch (error) {
    console.error("Get stage inventory error:", error);
    res.status(500).json({ message: "Ошибка при получении комплектующих" });
  }
});

const updateStageInventorySchema = z.object({
  quantity: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  adminNotes: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "installed"]).optional(),
});

/**
 * PATCH /api/admin/order-stage-inventory/:id - Обновить комплектующее этапа
 */
router.patch("/order-stage-inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateStageInventorySchema.parse(req.body);

    const item = await adminService.updateOrderStageInventoryItem(id, data);
    res.json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Update stage inventory error:", error);
    res.status(500).json({ message: "Ошибка при обновлении комплектующего" });
  }
});

/**
 * DELETE /api/admin/order-stage-inventory/:id - Удалить комплектующее из этапа
 */
router.delete("/order-stage-inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.removeInventoryFromOrderStage(id);
    res.json({ message: "Комплектующее удалено" });
  } catch (error) {
    console.error("Delete stage inventory error:", error);
    res.status(500).json({ message: "Ошибка при удалении комплектующего" });
  }
});

// ============================================================================
// УПРАВЛЕНИЕ РЕКОМЕНДУЕМЫМИ КОМПЛЕКТУЮЩИМИ ДЛЯ ШАБЛОНОВ ЭТАПОВ
// ============================================================================

const addTemplateInventorySchema = z.object({
  inventoryItemId: z.string(),
  isRequired: z.boolean().optional(),
  quantity: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/stage-templates/:templateId/inventory - Добавить комплектующее к шаблону
 */
router.post("/stage-templates/:templateId/inventory", async (req, res) => {
  try {
    const { templateId } = req.params;
    const data = addTemplateInventorySchema.parse(req.body);

    const item = await adminService.addInventoryToStageTemplate({
      stageTemplateId: templateId,
      ...data,
    });

    res.status(201).json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Add template inventory error:", error);
    res.status(500).json({ message: "Ошибка при добавлении комплектующего" });
  }
});

/**
 * GET /api/admin/stage-templates/:templateId/inventory - Получить рекомендуемые комплектующие
 */
router.get("/stage-templates/:templateId/inventory", async (req, res) => {
  try {
    const { templateId } = req.params;
    const items = await adminService.getStageTemplateSuggestedItems(templateId);
    res.json({ items });
  } catch (error) {
    console.error("Get template inventory error:", error);
    res.status(500).json({ message: "Ошибка при получении комплектующих" });
  }
});

/**
 * DELETE /api/admin/stage-template-inventory/:id - Удалить комплектующее из шаблона
 */
router.delete("/stage-template-inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.removeInventoryFromStageTemplate(id);
    res.json({ message: "Комплектующее удалено из шаблона" });
  } catch (error) {
    console.error("Delete template inventory error:", error);
    res.status(500).json({ message: "Ошибка при удалении комплектующего" });
  }
});

export const adminRouter = router;

