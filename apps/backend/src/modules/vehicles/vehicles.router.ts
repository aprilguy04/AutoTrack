/**
 * Роутер для работы с автомобилями
 */
import { Router } from "express";
import { vehiclesService } from "./vehicles.service.js";

const router = Router();

/**
 * GET /api/vehicles/brands - Получить все марки (с поиском)
 */
router.get("/brands", async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const brands = await vehiclesService.getBrands(search);
    res.json({ brands });
  } catch (error: any) {
    console.error("Get brands error:", error);
    res.status(500).json({ message: "Ошибка при получении марок" });
  }
});

/**
 * GET /api/vehicles/brands/:brandId/models - Получить модели по марке (с поиском)
 */
router.get("/brands/:brandId/models", async (req, res) => {
  try {
    const { brandId } = req.params;
    const search = req.query.search as string | undefined;
    const models = await vehiclesService.getModelsByBrand(brandId, search);
    res.json({ models });
  } catch (error: any) {
    console.error("Get models error:", error);
    res.status(500).json({ message: "Ошибка при получении моделей" });
  }
});

/**
 * GET /api/vehicles/models/:modelId/generations - Получить поколения по модели (с поиском)
 */
router.get("/models/:modelId/generations", async (req, res) => {
  try {
    const { modelId } = req.params;
    const search = req.query.search as string | undefined;
    const generations = await vehiclesService.getGenerationsByModel(modelId, search);
    res.json({ generations });
  } catch (error: any) {
    console.error("Get generations error:", error);
    res.status(500).json({ message: "Ошибка при получении поколений" });
  }
});

/**
 * GET /api/vehicles/generations/:generationId - Получить поколение по ID
 */
router.get("/generations/:generationId", async (req, res) => {
  try {
    const { generationId } = req.params;
    const generation = await vehiclesService.getGenerationById(generationId);
    if (!generation) {
      res.status(404).json({ message: "Поколение не найдено" });
      return;
    }
    res.json({ generation });
  } catch (error: any) {
    console.error("Get generation error:", error);
    res.status(500).json({ message: "Ошибка при получении поколения" });
  }
});

export const vehiclesRouter = router;
