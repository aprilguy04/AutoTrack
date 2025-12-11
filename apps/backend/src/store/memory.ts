type Role = "guest" | "client" | "mechanic" | "admin";

export type UserRecord = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

export type StageRecord = {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "done";
  assignedTo?: string;
  orderId: string;
};

export type OrderRecord = {
  id: string;
  title: string;
  customerId: string;
  vehicle: string;
  stages: StageRecord[];
};

export const usersTable: UserRecord[] = [
  { id: "usr_1", email: "client@example.com", fullName: "Demo Client", role: "client" },
  { id: "usr_2", email: "mechanic@example.com", fullName: "Demo Mechanic", role: "mechanic" },
  { id: "usr_3", email: "admin@example.com", fullName: "Demo Admin", role: "admin" },
];

export const ordersTable: OrderRecord[] = [
  {
    id: "ord_1",
    title: "Диагностика двигателя",
    customerId: "usr_1",
    vehicle: "VW Passat",
    stages: [
      { id: "stg_1", name: "Проверка ошибок", status: "done", orderId: "ord_1", assignedTo: "usr_2" },
      { id: "stg_2", name: "Разбор узла", status: "in_progress", orderId: "ord_1", assignedTo: "usr_2" },
      { id: "stg_3", name: "Сборка", status: "pending", orderId: "ord_1" },
    ],
  },
];






