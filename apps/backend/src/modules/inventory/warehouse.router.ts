/**
 * Роутер для управления складом (только для администратора)
 * CRUD операции с комплектующими, управление совместимостью
 */
import { Router } from "express";
import { z } from "zod";
import { inventoryService } from "./inventory.service.js";
import { authenticateToken, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

// Все роуты требуют роль администратора
router.use(authenticateToken);
router.use(requireRole("admin"));

// ============================================================================
// CRUD КОМПЛЕКТУЮЩИХ
// ============================================================================

const createInventoryItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  sku: z.string().optional(),
  oemNumber: z.string().optional(),
  manufacturerPartNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  isUniversal: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/warehouse - Получить все комплектующие с фильтрацией
 */
router.get("/", async (req, res) => {
  try {
    const { category, isUniversal, isActive, manufacturer, search } = req.query;

    const items = await inventoryService.getInventoryItems({
      category: category as string | undefined,
      isUniversal: isUniversal === "true" ? true : isUniversal === "false" ? false : undefined,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      manufacturer: manufacturer as string | undefined,
      search: search as string | undefined,
    });

    res.json({ items });
  } catch (error) {
    console.error("Get inventory items error:", error);
    res.status(500).json({ message: "Ошибка при получении комплектующих" });
  }
});

/**
 * GET /api/warehouse/compatible - Получить совместимые комплектующие для автомобиля
 */
router.get("/compatible", async (req, res) => {
  try {
    const { vehicleBrandId, vehicleModelId, vehicleGenerationId, vehicleYear, category } = req.query;

    const items = await inventoryService.getCompatibleInventoryItems({
      vehicleBrandId: vehicleBrandId as string | undefined,
      vehicleModelId: vehicleModelId as string | undefined,
      vehicleGenerationId: vehicleGenerationId as string | undefined,
      vehicleYear: vehicleYear ? parseInt(vehicleYear as string) : undefined,
      category: category as string | undefined,
    });

    res.json({ items });
  } catch (error) {
    console.error("Get compatible items error:", error);
    res.status(500).json({ message: "Ошибка при получении совместимых комплектующих" });
  }
});

/**
 * GET /api/warehouse/:id - Получить комплектующее по ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await inventoryService.getInventoryItemById(id);

    if (!item) {
      res.status(404).json({ message: "Комплектующее не найдено" });
      return;
    }

    res.json({ item });
  } catch (error) {
    console.error("Get inventory item error:", error);
    res.status(500).json({ message: "Ошибка при получении комплектующего" });
  }
});

/**
 * POST /api/warehouse - Создать комплектующее
 */
router.post("/", async (req, res) => {
  try {
    const data = createInventoryItemSchema.parse(req.body);
    const item = await inventoryService.createInventoryItem(data);
    res.status(201).json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Create inventory item error:", error);
    res.status(500).json({ message: "Ошибка при создании комплектующего" });
  }
});

const updateInventoryItemSchema = createInventoryItemSchema.partial();

/**
 * PATCH /api/warehouse/:id - Обновить комплектующее
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateInventoryItemSchema.parse(req.body);
    const item = await inventoryService.updateInventoryItem(id, data);
    res.json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Update inventory item error:", error);
    res.status(500).json({ message: "Ошибка при обновлении комплектующего" });
  }
});

/**
 * DELETE /api/warehouse/:id - Удалить комплектующее
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await inventoryService.deleteInventoryItem(id);
    res.json({ message: "Комплектующее удалено" });
  } catch (error) {
    console.error("Delete inventory item error:", error);
    res.status(500).json({ message: "Ошибка при удалении комплектующего" });
  }
});

// ============================================================================
// УПРАВЛЕНИЕ СОВМЕСТИМОСТЬЮ
// ============================================================================

const addCompatibilitySchema = z.object({
  inventoryItemId: z.string(),
  vehicleBrandId: z.string().optional(),
  vehicleModelId: z.string().optional(),
  vehicleGenerationId: z.string().optional(),
  yearFrom: z.number().int().min(1900).optional(),
  yearTo: z.number().int().min(1900).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/warehouse/compatibility - Добавить совместимость
 */
router.post("/compatibility", async (req, res) => {
  try {
    const data = addCompatibilitySchema.parse(req.body);
    const compatibility = await inventoryService.addCompatibility(data);
    res.status(201).json({ compatibility });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Add compatibility error:", error);
    res.status(500).json({ message: "Ошибка при добавлении совместимости" });
  }
});

/**
 * DELETE /api/warehouse/compatibility/:id - Удалить совместимость
 */
router.delete("/compatibility/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await inventoryService.removeCompatibility(id);
    res.json({ message: "Совместимость удалена" });
  } catch (error) {
    console.error("Delete compatibility error:", error);
    res.status(500).json({ message: "Ошибка при удалении совместимости" });
  }
});

// ============================================================================
// КРОСС-ССЫЛКИ (АНАЛОГИ/ЗАМЕНЫ)
// ============================================================================

const addCrossReferenceSchema = z.object({
  fromItemId: z.string(),
  toItemId: z.string(),
  referenceType: z.enum(["replacement", "analog", "upgrade", "downgrade"]),
  notes: z.string().optional(),
});

/**
 * POST /api/warehouse/cross-reference - Добавить кросс-ссылку
 */
router.post("/cross-reference", async (req, res) => {
  try {
    const data = addCrossReferenceSchema.parse(req.body);
    const crossRef = await inventoryService.addCrossReference(data);
    res.status(201).json({ crossRef });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Add cross reference error:", error);
    res.status(500).json({ message: "Ошибка при добавлении кросс-ссылки" });
  }
});

/**
 * DELETE /api/warehouse/cross-reference/:id - Удалить кросс-ссылку
 */
router.delete("/cross-reference/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await inventoryService.removeCrossReference(id);
    res.json({ message: "Кросс-ссылка удалена" });
  } catch (error) {
    console.error("Delete cross reference error:", error);
    res.status(500).json({ message: "Ошибка при удалении кросс-ссылки" });
  }
});

export const warehouseRouter = router;
