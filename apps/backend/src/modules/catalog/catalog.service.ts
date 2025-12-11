/**
 * Сервис для работы с каталогом услуг и комплектующих
 */
import { prisma } from "../../db/prisma.js";

export const catalogService = {
  /**
   * Получить все шаблоны услуг
   */
  async getServiceTemplates() {
    return prisma.serviceTemplate.findMany({
      where: { isActive: true },
      include: {
        stageTemplates: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Получить шаблон услуги по ID
   */
  async getServiceTemplateById(id: string) {
    return prisma.serviceTemplate.findUnique({
      where: { id },
      include: {
        stageTemplates: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  },

  /**
   * Получить все комплектующие
   */
  async getInventoryItems(category?: string) {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }

    return prisma.inventoryItem.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },

  /**
   * Получить комплектующее по ID
   */
  async getInventoryItemById(id: string) {
    return prisma.inventoryItem.findUnique({
      where: { id },
    });
  },
};



