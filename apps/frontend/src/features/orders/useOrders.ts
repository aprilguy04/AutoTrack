import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi, type Order } from "./api.js";

export type StageDto = {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "done" | "blocked";
  assignedTo?: string;
  orderIndex: number;
};

export type OrderDto = {
  id: string;
  title: string;
  vehicle: string;
  serviceType: string;
  serviceTypeLabel: string;
  status: string;
  stages: StageDto[];
  createdAt: string;
  updatedAt: string;
};

const serviceTypeLabels: Record<string, string> = {
  diagnostics: "Диагностика",
  repair: "Ремонт",
  maintenance: "Техническое обслуживание",
  other: "Другое",
};

/**
 * Преобразует Order из API в OrderDto для компонентов
 */
function transformOrder(order: Order): OrderDto {
  // Формируем строку с информацией об автомобиле
  let vehicle = "Не указан";
  if (order.vehicleGeneration) {
    const gen = order.vehicleGeneration;
    vehicle = `${gen.model.brand.nameRu || gen.model.brand.name} ${gen.model.nameRu || gen.model.name} ${gen.nameRu || gen.name}`;
    if (order.vehicleYear) {
      vehicle += ` ${order.vehicleYear}`;
    }
  } else if (order.vehicleInfo) {
    vehicle = order.vehicleInfo;
  }

  // Формируем label для типа услуги
  const serviceType = order.serviceType || "other";
  let serviceTypeLabel = serviceTypeLabels[serviceType] || serviceType;
  if (serviceType === "other" && order.serviceTypeOther) {
    serviceTypeLabel = order.serviceTypeOther;
  }

  // Преобразуем этапы
  const stages: StageDto[] = (order.stages || []).map((stage: any) => ({
    id: stage.id,
    name: stage.name,
    status: stage.status === "done" ? "done" : stage.status === "in_progress" ? "in_progress" : "pending",
    assignedTo: stage.mechanic?.fullName,
    orderIndex: stage.orderIndex || 0,
  }));

  return {
    id: order.id,
    title: order.title,
    vehicle,
    serviceType,
    serviceTypeLabel,
    status: order.status,
    stages,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export const useOrders = () => {
  return useQuery({
    queryKey: ["orders", "client"],
    queryFn: async () => {
      let orders: Order[] = [];
      try {
        const response = await ordersApi.getAll();
        if (Array.isArray(response.orders)) {
          orders = response.orders;
        } else {
          console.warn("Invalid orders response:", response);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
      return orders.map(transformOrder);
    },
    retry: 1,
    staleTime: 30000, // 30 секунд
    placeholderData: [],
    initialData: [],
  });
};

/**
 * Хук для инвалидации кеша заказов
 */
export const useInvalidateOrders = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };
};
