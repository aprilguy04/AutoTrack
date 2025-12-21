/**
 * Сервис для работы с комплектующими и складом
 *
 * Основной функционал:
 * - Управление складом (CRUD операции с комплектующими)
 * - Управление совместимостью деталей с моделями автомобилей
 * - Умная фильтрация деталей по автомобилю заказа
 * - Кросс-ссылки на аналоги и замены
 */
import { prisma } from "../../db/prisma.js";
import type { Prisma } from "@prisma/client";

export const inventoryService = {
  /**
   * Получить все комплектующие с фильтрацией
   */
  async getInventoryItems(filter?: {
    category?: string;
    isUniversal?: boolean;
    isActive?: boolean;
    manufacturer?: string;
    search?: string;
  }) {
    const where: Prisma.InventoryItemWhereInput = {};

    if (filter?.category) {
      where.category = filter.category;
    }
    if (filter?.isUniversal !== undefined) {
      where.isUniversal = filter.isUniversal;
    }
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }
    if (filter?.manufacturer) {
      where.manufacturer = filter.manufacturer;
    }
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search } },
        { description: { contains: filter.search } },
        { sku: { contains: filter.search } },
        { oemNumber: { contains: filter.search } },
      ];
    }

    return prisma.inventoryItem.findMany({
      where,
      include: {
        compatibility: {
          include: {
            vehicleBrand: true,
            vehicleModel: true,
            vehicleGeneration: true,
          },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  },

  /**
   * Получить комплектующее по ID
   */
  async getInventoryItemById(id: string) {
    return prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        compatibility: {
          include: {
            vehicleBrand: true,
            vehicleModel: true,
            vehicleGeneration: true,
          },
        },
        crossReferences: {
          include: {
            toItem: true,
          },
        },
        referencedBy: {
          include: {
            fromItem: true,
          },
        },
      },
    });
  },

  /**
   * Получить комплектующие, совместимые с конкретным автомобилем
   * Это ключевая функция - фильтрует детали по модели авто!
   */
  async getCompatibleInventoryItems(params: {
    vehicleBrandId?: string;
    vehicleModelId?: string;
    vehicleGenerationId?: string;
    vehicleYear?: number;
    category?: string;
  }) {
    const { vehicleBrandId, vehicleModelId, vehicleGenerationId, vehicleYear, category } = params;

    // Находим универсальные детали
    const universalItems = await prisma.inventoryItem.findMany({
      where: {
        isUniversal: true,
        isActive: true,
        ...(category && { category }),
      },
    });

    // Если не указаны параметры автомобиля, возвращаем только универсальные
    if (!vehicleBrandId && !vehicleModelId && !vehicleGenerationId) {
      return universalItems;
    }

    // Находим совместимые детали
    const compatibilityQuery: Prisma.InventoryItemCompatibilityWhereInput = {
      OR: [],
    };

    // Совместимость с конкретным поколением
    if (vehicleGenerationId) {
      (compatibilityQuery.OR as any[]).push({
        vehicleGenerationId,
        ...(vehicleYear && {
          OR: [
            { yearFrom: null, yearTo: null },
            { yearFrom: { lte: vehicleYear }, yearTo: { gte: vehicleYear } },
            { yearFrom: { lte: vehicleYear }, yearTo: null },
            { yearFrom: null, yearTo: { gte: vehicleYear } },
          ],
        }),
      });
    }

    // Совместимость со всеми поколениями модели
    if (vehicleModelId) {
      (compatibilityQuery.OR as any[]).push({
        vehicleModelId,
        vehicleGenerationId: null,
      });
    }

    // Совместимость со всеми моделями бренда
    if (vehicleBrandId) {
      (compatibilityQuery.OR as any[]).push({
        vehicleBrandId,
        vehicleModelId: null,
        vehicleGenerationId: null,
      });
    }

    const compatibilities = await prisma.inventoryItemCompatibility.findMany({
      where: compatibilityQuery,
      include: {
        inventoryItem: {
          include: {
            compatibility: {
              include: {
                vehicleBrand: true,
                vehicleModel: true,
                vehicleGeneration: true,
              },
            },
          },
        },
      },
    });

    const compatibleItems = compatibilities
      .map((c) => c.inventoryItem)
      .filter((item) => item.isActive && (!category || item.category === category));

    // Объединяем универсальные и совместимые детали (без дубликатов)
    const allItems = [...universalItems];
    const existingIds = new Set(universalItems.map((i) => i.id));

    compatibleItems.forEach((item) => {
      if (!existingIds.has(item.id)) {
        allItems.push(item);
        existingIds.add(item.id);
      }
    });

    return allItems;
  },

  /**
   * Создать комплектующее
   */
  async createInventoryItem(data: {
    name: string;
    description?: string;
    category: string;
    subcategory?: string;
    sku?: string;
    oemNumber?: string;
    manufacturerPartNumber?: string;
    manufacturer?: string;
    stock?: number;
    minStock?: number;
    unit?: string;
    price?: number;
    cost?: number;
    isUniversal?: boolean;
    weight?: number;
    location?: string;
    notes?: string;
  }) {
    return prisma.inventoryItem.create({
      data,
    });
  },

  /**
   * Обновить комплектующее
   */
  async updateInventoryItem(id: string, data: Partial<Omit<Prisma.InventoryItemUpdateInput, 'id'>>) {
    return prisma.inventoryItem.update({
      where: { id },
      data,
    });
  },

  /**
   * Удалить комплектующее
   */
  async deleteInventoryItem(id: string) {
    return prisma.inventoryItem.delete({
      where: { id },
    });
  },

  /**
   * Добавить совместимость детали с моделью автомобиля
   */
  async addCompatibility(data: {
    inventoryItemId: string;
    vehicleBrandId?: string;
    vehicleModelId?: string;
    vehicleGenerationId?: string;
    yearFrom?: number;
    yearTo?: number;
    notes?: string;
  }) {
    return prisma.inventoryItemCompatibility.create({
      data,
    });
  },

  /**
   * Удалить совместимость
   */
  async removeCompatibility(id: string) {
    return prisma.inventoryItemCompatibility.delete({
      where: { id },
    });
  },

  /**
   * Добавить кросс-ссылку (аналог/замену)
   */
  async addCrossReference(data: {
    fromItemId: string;
    toItemId: string;
    referenceType: "replacement" | "analog" | "upgrade" | "downgrade";
    notes?: string;
  }) {
    return prisma.inventoryItemCrossReference.create({
      data,
    });
  },

  /**
   * Удалить кросс-ссылку
   */
  async removeCrossReference(id: string) {
    return prisma.inventoryItemCrossReference.delete({
      where: { id },
    });
  },

  // ============================================================================
  // СТАРЫЙ ФУНКЦИОНАЛ (для обратной совместимости)
  // ============================================================================

  /**
   * Добавить комплектующее в заказ (старый метод)
   */
  async addItemToOrder(orderId: string, inventoryItemId: string, quantity: number) {
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error("Комплектующее не найдено");
    }

    if (!inventoryItem.isActive) {
      throw new Error("Комплектующее не доступно");
    }

    if (inventoryItem.stock < quantity) {
      throw new Error("Недостаточно товара на складе");
    }

    const existing = await prisma.orderInventoryItem.findUnique({
      where: {
        orderId_inventoryItemId: {
          orderId,
          inventoryItemId,
        },
      },
    });

    if (existing) {
      return prisma.orderInventoryItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          unitPrice: inventoryItem.price,
        },
      });
    }

    return prisma.orderInventoryItem.create({
      data: {
        orderId,
        inventoryItemId,
        quantity,
        unitPrice: inventoryItem.price,
      },
      include: {
        inventoryItem: true,
      },
    });
  },

  /**
   * Удалить комплектующее из заказа
   */
  async removeItemFromOrder(orderId: string, inventoryItemId: string) {
    return prisma.orderInventoryItem.delete({
      where: {
        orderId_inventoryItemId: {
          orderId,
          inventoryItemId,
        },
      },
    });
  },

  /**
   * Получить комплектующие заказа
   */
  async getOrderItems(orderId: string) {
    return prisma.orderInventoryItem.findMany({
      where: { orderId },
      include: {
        inventoryItem: true,
      },
    });
  },

  /**
   * Обновить количество комплектующего в заказе
   */
  async updateItemQuantity(orderId: string, inventoryItemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItemFromOrder(orderId, inventoryItemId);
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error("Комплектующее не найдено");
    }

    if (inventoryItem.stock < quantity) {
      throw new Error("Недостаточно товара на складе");
    }

    return prisma.orderInventoryItem.update({
      where: {
        orderId_inventoryItemId: {
          orderId,
          inventoryItemId,
        },
      },
      data: {
        quantity,
        unitPrice: inventoryItem.price,
      },
      include: {
        inventoryItem: true,
      },
    });
  },
};
