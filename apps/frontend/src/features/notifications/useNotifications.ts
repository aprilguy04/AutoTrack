import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type Notification } from "./api.js";

export const useNotifications = () =>
  useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { notifications } = await notificationsApi.list();
      return notifications ?? [];
    },
    staleTime: 10000,
  });

export const useNotificationActions = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  });

  return { markRead, markAll };
};

