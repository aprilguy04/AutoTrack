/**
 * Сервис для работы с автомобилями
 */
import { prisma } from "../../db/prisma.js";

export const vehiclesService = {
  /**
   * Получить все марки с поиском
   */
  async getBrands(search?: string) {
    const where: any = { isActive: true };

    const brands = await prisma.vehicleBrand.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Фильтруем на уровне приложения для case-insensitive поиска
    if (search) {
      const searchLower = search.toLowerCase();
      return brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(searchLower) ||
          (brand.nameRu && brand.nameRu.toLowerCase().includes(searchLower)),
      );
    }

    return brands;
  },

  /**
   * Получить модели по марке с поиском
   */
  async getModelsByBrand(brandId: string, search?: string) {
    const where: any = {
      brandId,
      isActive: true,
    };

    const models = await prisma.vehicleModel.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Фильтруем на уровне приложения для case-insensitive поиска
    if (search) {
      const searchLower = search.toLowerCase();
      return models.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          (m.nameRu && m.nameRu.toLowerCase().includes(searchLower)),
      );
    }

    return models;
  },

  /**
   * Получить поколения по модели с поиском
   */
  async getGenerationsByModel(modelId: string, search?: string) {
    const where: any = {
      modelId,
      isActive: true,
    };

    const generations = await prisma.vehicleGeneration.findMany({
      where,
      orderBy: { yearFrom: "desc" },
    });

    // Фильтруем на уровне приложения для case-insensitive поиска
    if (search) {
      const searchLower = search.toLowerCase();
      return generations.filter(
        (g) =>
          g.name.toLowerCase().includes(searchLower) ||
          (g.nameRu && g.nameRu.toLowerCase().includes(searchLower)),
      );
    }

    return generations;
  },

  /**
   * Получить поколение по ID
   */
  async getGenerationById(generationId: string) {
    return prisma.vehicleGeneration.findUnique({
      where: { id: generationId },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
      },
    });
  },
};
