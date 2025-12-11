/**
 * Роутер для работы с каталогом
 */
import { Router } from "express";
import { catalogService } from "./catalog.service.js";

const router = Router();

/**
 * GET /api/catalog/services - Получить все шаблоны услуг
 */
router.get("/services", async (req, res) => {
  try {
    const services = await catalogService.getServiceTemplates();
    res.json({ services });
  } catch (error: any) {
    console.error("Get services error:", error);
    res.status(500).json({ message: "Ошибка при получении услуг" });
  }
});

/**
 * GET /api/catalog/services/:id - Получить шаблон услуги по ID
 */
router.get("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await catalogService.getServiceTemplateById(id);
    if (!service) {
      res.status(404).json({ message: "Услуга не найдена" });
      return;
    }
    res.json({ service });
  } catch (error: any) {
    console.error("Get service error:", error);
    res.status(500).json({ message: "Ошибка при получении услуги" });
  }
});

/**
 * GET /api/catalog/inventory - Получить все комплектующие
 */
router.get("/inventory", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const items = await catalogService.getInventoryItems(category);
    res.json({ items });
  } catch (error: any) {
    console.error("Get inventory error:", error);
    res.status(500).json({ message: "Ошибка при получении комплектующих" });
  }
});

/**
 * GET /api/catalog/inventory/:id - Получить комплектующее по ID
 */
router.get("/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await catalogService.getInventoryItemById(id);
    if (!item) {
      res.status(404).json({ message: "Комплектующее не найдено" });
      return;
    }
    res.json({ item });
  } catch (error: any) {
    console.error("Get inventory item error:", error);
    res.status(500).json({ message: "Ошибка при получении комплектующего" });
  }
});

export const catalogRouter = router;
