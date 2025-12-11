import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stagesApi } from "./api.js";
import type { Order } from "../orders/api.js";

export const useOrderStages = (orderId: string, enabled = true) =>
  useQuery<Order["stages"]>({
    queryKey: ["stages", orderId],
    queryFn: async () => {
      const { stages } = await stagesApi.getByOrder(orderId);
      return stages ?? [];
    },
    enabled: Boolean(orderId) && enabled,
    initialData: [],
  });

export const useStageDetails = (stageId: string | null) =>
  useQuery({
    queryKey: ["stage", stageId],
    queryFn: async () => {
      if (!stageId) {
        return null;
      }
      const { stage } = await stagesApi.getById(stageId);
      return stage;
    },
    enabled: Boolean(stageId),
  });

export const useStageMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = (orderId?: string, stageId?: string) => {
    if (orderId) {
      queryClient.invalidateQueries({ queryKey: ["stages", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders", "client"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
    }
    if (stageId) {
      queryClient.invalidateQueries({ queryKey: ["stage", stageId] });
    }
    queryClient.invalidateQueries({ queryKey: ["mechanic", "assigned"] });
  };

  const updateStatus = useMutation({
    mutationFn: ({ stageId, status, comment }: { stageId: string; status: string; comment?: string }) =>
      stagesApi.updateStatus(stageId, { status, comment }),
    onSuccess: (result) => {
      invalidate(result.stage?.orderId, result.stage?.id);
    },
  });

  const addComment = useMutation({
    mutationFn: ({ stageId, content }: { stageId: string; content: string }) => stagesApi.addComment(stageId, content),
    onSuccess: (_, variables) => {
      invalidate(undefined, variables.stageId);
    },
  });

  const addAttachment = useMutation({
    mutationFn: (payload: {
      stageId: string;
      base64: string;
      fileName?: string;
      description?: string;
      mimeType?: string;
    }) => stagesApi.addAttachment(payload.stageId, payload),
    onSuccess: (_, variables) => {
      invalidate(undefined, variables.stageId);
    },
  });

  const markViewed = useMutation({
    mutationFn: (stageId: string) => stagesApi.markViewed(stageId),
    onSuccess: (_, stageId) => {
      invalidate(undefined, stageId);
    },
  });

  return {
    updateStatus,
    addComment,
    addAttachment,
    markViewed,
  };
};

