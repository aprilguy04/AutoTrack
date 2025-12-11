/**
 * API функции для работы с заказами
 */
import { api } from "../../shared/api/client.js";

export interface CreateOrderData {
  title?: string;
  description?: string;
  vehicleGenerationId?: string;
  vehicleYear?: number;
  vehicleInfo?: string;
  serviceType: "diagnostics" | "repair" | "maintenance" | "other";
  serviceTypeOther?: string;
}

export interface StageComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    email?: string;
  };
}

export interface StageAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
  description?: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    fullName: string;
  };
}

export interface Order {
  id: string;
  title: string;
  description?: string;
  status: string;
  serviceType: string;
  serviceTypeOther?: string;
  vehicleGeneration?: {
    id: string;
    name: string;
    nameRu?: string;
    model: {
      id: string;
      name: string;
      nameRu?: string;
      brand: {
        id: string;
        name: string;
        nameRu?: string;
      };
    };
  };
  vehicleYear?: number;
  vehicleInfo?: string;
  stages?: Array<{
    id: string;
    orderId: string;
    name: string;
    description?: string;
    status: string;
    orderIndex: number;
    assignedTo?: string;
    lastViewedAt?: string | null;
    mechanic?: {
      id: string;
      fullName: string;
      email: string;
    };
    startedAt?: string;
    completedAt?: string;
    comments?: StageComment[];
    attachments?: StageAttachment[];
  }>;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  adminLastViewedAt?: string | null;
}

export const ordersApi = {
  /**
   * Создать новый заказ
   */
  create: async (data: CreateOrderData): Promise<{ order: Order }> => {
    const response = await api.post<{ order: Order }>("/orders", data);
    return response.data;
  },

  /**
   * Получить все заказы пользователя
   */
  getAll: async (): Promise<{ orders: Order[] }> => {
    const response = await api.get<{ orders: Order[] }>("/orders");
    return response.data;
  },

  /**
   * Получить заказ по ID
   */
  getById: async (id: string): Promise<{ order: Order }> => {
    const response = await api.get<{ order: Order }>(`/orders/${id}`);
    return response.data;
  },
};

