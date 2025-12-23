/**
 * Сервис для администратора
 */
import { prisma } from "../../db/prisma.js";
import { ordersService } from "../orders/orders.service.js";
import { stagesService } from "../stages/stages.service.js";
import { notificationsService } from "../notifications/notifications.service.js";

export const adminService = {
  /**
   * Создать шаблон этапа
   */
  async createStageTemplate(data: {
    serviceTemplateId: string;
    name: string;
    description?: string;
    orderIndex: number;
    estimatedHours?: number;
    isRequired?: boolean;
  }) {
    return prisma.stageTemplate.create({
      data,
      include: {
        serviceTemplate: true,
      },
    });
  },

  /**
   * Обновить шаблон этапа
   */
  async updateStageTemplate(id: string, data: {
    name?: string;
    description?: string;
    orderIndex?: number;
    estimatedHours?: number;
    isRequired?: boolean;
  }) {
    return prisma.stageTemplate.update({
      where: { id },
      data,
      include: {
        serviceTemplate: true,
      },
    });
  },

  /**
   * Удалить шаблон этапа
   */
  async deleteStageTemplate(id: string) {
    return prisma.stageTemplate.delete({
      where: { id },
    });
  },

  /**
   * Создать шаблон услуги
   */
  async createServiceTemplate(data: {
    name: string;
    description?: string;
  }) {
    return prisma.serviceTemplate.create({
      data,
    });
  },

  /**
   * Обновить шаблон услуги
   */
  async updateServiceTemplate(id: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }) {
    return prisma.serviceTemplate.update({
      where: { id },
      data,
    });
  },

  /**
   * Удалить шаблон услуги
   */
  async deleteServiceTemplate(id: string) {
    return prisma.serviceTemplate.delete({
      where: { id },
    });
  },

  /**
   * Добавить рекомендуемое комплектующее к шаблону этапа
   */
  async addInventoryToStageTemplate(data: {
    stageTemplateId: string;
    inventoryItemId: string;
    isRequired?: boolean;
    quantity?: number;
    notes?: string;
  }) {
    return prisma.stageTemplateInventoryItem.create({
      data,
      include: {
        inventoryItem: true,
        stageTemplate: true,
      },
    });
  },

  /**
   * Удалить комплектующее из шаблона этапа
   */
  async removeInventoryFromStageTemplate(id: string) {
    return prisma.stageTemplateInventoryItem.delete({
      where: { id },
    });
  },

  /**
   * Получить рекомендуемые комплектующие для шаблона этапа
   */
  async getStageTemplateSuggestedItems(stageTemplateId: string) {
    return prisma.stageTemplateInventoryItem.findMany({
      where: { stageTemplateId },
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
  },

  /**
   * Предложить комплектующие клиенту для конкретного этапа заказа
   * Учитывает автомобиль клиента и показывает только совместимые детали
   */
  async suggestInventoryForOrderStage(data: {
    orderStageId: string;
    inventoryItemId: string;
    quantity?: number;
    isRequired?: boolean;
    adminNotes?: string;
  }) {
    const stage = await prisma.orderStage.findUnique({
      where: { id: data.orderStageId },
      include: {
        order: {
          include: {
            vehicleGeneration: {
              include: {
                model: {
                  include: {
                    brand: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!stage) {
      throw new Error("Этап не найден");
    }

    // Получаем цену из комплектующего
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error("Комплектующее не найдено");
    }

    const quantity = data.quantity || 1;

    // Проверяем наличие на складе
    if (inventoryItem.stock < quantity) {
      throw new Error(`Недостаточно товара на складе. Доступно: ${inventoryItem.stock}, требуется: ${quantity}`);
    }

    // Если комплектующее обязательное - сразу списываем со склада
    if (data.isRequired) {
      await prisma.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: {
          stock: { decrement: quantity },
        },
      });
    }

    const suggestion = await prisma.orderStageInventoryItem.create({
      data: {
        orderStageId: data.orderStageId,
        inventoryItemId: data.inventoryItemId,
        quantity: quantity,
        isRequired: data.isRequired || false,
        adminNotes: data.adminNotes,
        unitPrice: inventoryItem.price,
        suggestedByAdmin: true,
        status: "pending",
      },
      include: {
        inventoryItem: true,
      },
    });

    // Уведомляем клиента о предложенном комплектующем
    try {
      await notificationsService.create({
        userId: stage.order.customerId,
        orderId: stage.orderId,
        type: "inventory_suggested",
        title: "Предложены комплектующие",
        message: `Администратор предложил "${inventoryItem.name}" для этапа "${stage.name}"`,
        metadata: {
          stageId: stage.id,
          stageName: stage.name,
          orderTitle: stage.order.title,
          inventoryItemName: inventoryItem.name,
          quantity: data.quantity || 1,
        },
      });
    } catch (err) {
      console.error("Failed to notify client about inventory suggestion:", err);
    }

    return suggestion;
  },

  /**
   * Обновить предложенное комплектующее
   */
  async updateOrderStageInventoryItem(id: string, data: {
    quantity?: number;
    isRequired?: boolean;
    adminNotes?: string;
    status?: string;
  }) {
    return prisma.orderStageInventoryItem.update({
      where: { id },
      data,
      include: {
        inventoryItem: true,
      },
    });
  },

  /**
   * Удалить предложенное комплектующее из этапа
   * Возвращает товар на склад если он был списан (обязательный или одобренный клиентом)
   */
  async removeInventoryFromOrderStage(id: string) {
    // Получаем комплектующее перед удалением
    const item = await prisma.orderStageInventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new Error("Комплектующее не найдено");
    }

    // Возвращаем на склад если было списано:
    // - обязательное комплектующее (списывается сразу)
    // - опциональное одобренное клиентом
    if (item.isRequired || item.selectedByClient) {
      await prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    return prisma.orderStageInventoryItem.delete({
      where: { id },
    });
  },

  /**
   * Получить комплектующие для конкретного этапа заказа
   */
  async getOrderStageInventoryItems(orderStageId: string) {
    return prisma.orderStageInventoryItem.findMany({
      where: { orderStageId },
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
  },

  /**
   * Получить заказы с расширенной информацией
   */
  async getOrdersOverview() {
    const orders = await ordersService.getOrdersForAdmin();
    return orders.map((order) => {
      const done = order.stages.filter((stage) => stage.status === "done").length;
      const inProgress = order.stages.filter((stage) => stage.status === "in_progress").length;

      return {
        ...order,
        stats: {
          total: order.stages.length,
          done,
          inProgress,
        },
        isNewForAdmin: !order.adminLastViewedAt || order.adminLastViewedAt < order.createdAt,
      };
    });
  },

  /**
   * Отметить заказ как просмотренный администратором
   */
  async markOrderViewed(orderId: string) {
    await ordersService.markViewedByAdmin(orderId);
  },

  /**
   * Получить список механиков
   */
  async getMechanics() {
    return prisma.user.findMany({
      where: { role: "mechanic", isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: { fullName: "asc" },
    });
  },

  /**
   * Создать этап для конкретного заказа
   */
  async createOrderStage(orderId: string, data: {
    name: string;
    description?: string;
    orderIndex?: number;
    assignedTo?: string;
  }) {
    return stagesService.createStage(orderId, data);
  },

  /**
   * Обновить этап заказа
   */
  async updateOrderStage(stageId: string, data: {
    name?: string;
    description?: string;
    status?: "pending" | "in_progress" | "done" | "blocked";
    orderIndex?: number;
    assignedTo?: string | null;
  }) {
    return stagesService.updateStage(stageId, data);
  },

  /**
   * Переупорядочить этапы заказа
   */
  async reorderOrderStages(orderId: string, stages: Array<{ stageId: string; orderIndex: number }>) {
    await stagesService.reorderStages(orderId, stages);
  },

  /**
   * Удалить этап заказа
   */
  async deleteOrderStage(stageId: string) {
    return stagesService.deleteStage(stageId);
  },
};



