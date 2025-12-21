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
  vehicleGenerationId?: string;
}

export interface OrderStageInventoryItem {
  id: string;
  orderStageId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice?: number;
  isRequired: boolean;
  suggestedByAdmin: boolean;
  selectedByClient: boolean;
  status: string;
  clientNotes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  inventoryItem: {
    id: string;
    name: string;
    description?: string;
    category: string;
    sku?: string;
    oemNumber?: string;
    manufacturer?: string;
    price?: number;
    stock: number;
    unit: string;
  };
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
  // Управление комплектующими на этапах
  suggestInventoryForStage: async (
    stageId: string,
    payload: { inventoryItemId: string; quantity?: number; isRequired?: boolean; adminNotes?: string },
  ): Promise<{ item: OrderStageInventoryItem }> => {
    const response = await api.post<{ item: OrderStageInventoryItem }>(
      `/admin/order-stages/${stageId}/inventory`,
      payload
    );
    return response.data;
  },
  getStageInventoryItems: async (stageId: string): Promise<{ items: OrderStageInventoryItem[] }> => {
    const response = await api.get<{ items: OrderStageInventoryItem[] }>(
      `/admin/order-stages/${stageId}/inventory`
    );
    return response.data;
  },
  updateStageInventoryItem: async (
    itemId: string,
    payload: { quantity?: number; isRequired?: boolean; adminNotes?: string; status?: string },
  ): Promise<{ item: OrderStageInventoryItem }> => {
    const response = await api.patch<{ item: OrderStageInventoryItem }>(
      `/admin/order-stage-inventory/${itemId}`,
      payload
    );
    return response.data;
  },
  removeStageInventoryItem: async (itemId: string): Promise<void> => {
    await api.delete(`/admin/order-stage-inventory/${itemId}`);
  },
};

