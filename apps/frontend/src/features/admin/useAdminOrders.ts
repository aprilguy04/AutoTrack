import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminOrder, type MechanicUser } from "./api.js";

export const useAdminOrders = () =>
  useQuery<AdminOrder[]>({
    queryKey: ["orders", "admin"],
    queryFn: async () => {
      console.log('[Admin Orders] Fetching orders...');
      const { orders } = await adminApi.getOrders();
      console.log('[Admin Orders] Received orders:', orders.length);
      return orders;
    },
    staleTime: 30000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

export const useMechanics = () =>
  useQuery<MechanicUser[]>({
    queryKey: ["mechanics"],
    queryFn: async () => {
      const { mechanics } = await adminApi.getMechanics();
      return mechanics;
    },
    staleTime: 60000,
  });

export const useMarkOrderViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => adminApi.markOrderViewed(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
    },
  });
};

