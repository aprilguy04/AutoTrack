/**
 * Сервис для администратора
 */
import { prisma } from "../../db/prisma.js";
import { ordersService } from "../orders/orders.service.js";
import { stagesService } from "../stages/stages.service.js";

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
   * Назначить комплектующие на этап (для выбора клиентом)
   */
  async assignInventoryToStage(stageTemplateId: string, inventoryItemIds: string[]) {
    // Эта функциональность может быть реализована через отдельную таблицу связи
    // или через поле в StageTemplate. Пока оставим заглушку.
    // В реальной системе это может быть many-to-many связь между StageTemplate и InventoryItem
    return { message: "Функция в разработке" };
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
};



