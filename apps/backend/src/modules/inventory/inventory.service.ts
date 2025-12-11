/**
 * Сервис для работы с комплектующими в заказах
 */
import { prisma } from "../../db/prisma.js";

export const inventoryService = {
  /**
   * Добавить комплектующее в заказ
   */
  async addItemToOrder(orderId: string, inventoryItemId: string, quantity: number) {
    // Получаем информацию о комплектующем
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

    // Проверяем, есть ли уже это комплектующее в заказе
    const existing = await prisma.orderInventoryItem.findUnique({
      where: {
        orderId_inventoryItemId: {
          orderId,
          inventoryItemId,
        },
      },
    });

    if (existing) {
      // Обновляем количество
      return prisma.orderInventoryItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          unitPrice: inventoryItem.price,
        },
      });
    }

    // Создаем новую запись
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



