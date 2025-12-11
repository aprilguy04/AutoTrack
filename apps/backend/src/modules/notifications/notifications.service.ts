/**
 * Сервис уведомлений
 */
import { prisma } from "../../db/prisma.js";

export type NotificationPayload = {
  userId: string;
  title: string;
  message: string;
  type: string;
  channel?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
};

export const notificationsService = {
  async create(payload: NotificationPayload) {
    const { metadata, ...rest } = payload;
    return prisma.notification.create({
      data: {
        ...rest,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  },

  async getUserFeed(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },
};

