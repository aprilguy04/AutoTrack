import { api } from "../../shared/api/client.js";

export interface NotificationMetadata {
  stageId?: string;
  stageName?: string;
  orderTitle?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string | null;
  metadata?: string | null;
}

export const notificationsApi = {
  list: async (): Promise<{ notifications: Notification[] }> => {
    const response = await api.get<{ notifications: Notification[] }>("/notifications");
    return response.data;
  },
  markRead: async (id: string) => {
    await api.post(`/notifications/${id}/read`);
  },
  markAllRead: async () => {
    await api.post("/notifications/read-all");
  },
};

