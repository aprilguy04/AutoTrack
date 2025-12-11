import { api } from "../../shared/api/client.js";
import type { Order, StageAttachment, StageComment } from "../orders/api.js";

export interface StageDetailsResponse {
  stage: Order["stages"][number] & {
    order?: Pick<Order, "id" | "title" | "status" | "customer">;
    comments?: StageComment[];
    attachments?: StageAttachment[];
  };
}

export const stagesApi = {
  getByOrder: async (orderId: string) => {
    const response = await api.get<{ stages: Order["stages"] }>(`/stages/order/${orderId}`);
    return response.data;
  },
  getById: async (stageId: string) => {
    const response = await api.get<StageDetailsResponse>(`/stages/${stageId}`);
    return response.data;
  },
  getAssignedOrders: async () => {
    const response = await api.get<{ orders: Array<Order & { assignedStages: Order["stages"]; timeline: Order["stages"] }> }>(
      "/stages/assigned",
    );
    return response.data;
  },
  updateStatus: async (stageId: string, payload: { status: string; comment?: string }) => {
    const response = await api.patch<{ stage: Order["stages"][number] }>(`/stages/${stageId}`, payload);
    return response.data;
  },
  addComment: async (stageId: string, content: string) => {
    const response = await api.post<{ comment: StageComment }>(`/stages/${stageId}/comments`, { content });
    return response.data;
  },
  addAttachment: async (
    stageId: string,
    payload: { base64: string; fileName?: string; description?: string; mimeType?: string },
  ) => {
    const response = await api.post<{ attachment: StageAttachment }>(`/stages/${stageId}/attachments`, payload);
    return response.data;
  },
  markViewed: async (stageId: string) => {
    await api.post(`/stages/${stageId}/view`);
  },
};

