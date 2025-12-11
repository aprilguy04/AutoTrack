import { useQuery } from "@tanstack/react-query";
import { stagesApi } from "../stages/api.js";
import type { Order } from "../orders/api.js";

export type MechanicOrder = Order & {
  assignedStages: Order["stages"];
  timeline?: Order["stages"];
};

export const useAssignedOrders = () =>
  useQuery<MechanicOrder[]>({
    queryKey: ["mechanic", "assigned"],
    queryFn: async () => {
      const { orders } = await stagesApi.getAssignedOrders();
      return orders || [];
    },
    initialData: [],
    refetchInterval: 60000,
  });

