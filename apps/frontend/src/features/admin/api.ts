import { api } from "../../shared/api/client.js";
import type { Order } from "../orders/api.js";

export interface MechanicUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AdminOrder extends Order {
  stats: {
    total: number;
    done: number;
    inProgress: number;
  };
  isNewForAdmin: boolean;
}

export const adminApi = {
  getOrders: async (): Promise<{ orders: AdminOrder[] }> => {
    const response = await api.get<{ orders: AdminOrder[] }>("/admin/orders");
    return response.data;
  },
  markOrderViewed: async (orderId: string) => {
    await api.post(`/admin/orders/${orderId}/view`);
  },
  getMechanics: async (): Promise<{ mechanics: MechanicUser[] }> => {
    const response = await api.get<{ mechanics: MechanicUser[] }>("/admin/mechanics");
    return response.data;
  },
  createStage: async (
    orderId: string,
    payload: { name: string; description?: string; orderIndex?: number; assignedTo?: string },
  ) => {
    const response = await api.post(`/admin/orders/${orderId}/stages`, payload);
    return response.data;
  },
  updateStage: async (
    orderId: string,
    stageId: string,
    payload: { name?: string; description?: string; status?: string; orderIndex?: number; assignedTo?: string | null },
  ) => {
    const response = await api.patch(`/admin/orders/${orderId}/stages/${stageId}`, payload);
    return response.data;
  },
  reorderStages: async (orderId: string, stages: Array<{ stageId: string; orderIndex: number }>) => {
    await api.post(`/admin/orders/${orderId}/stages/reorder`, { stages });
  },
};

