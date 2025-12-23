import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminOrders, useMechanics, useMarkOrderViewed } from "../features/admin/useAdminOrders.ts";
import { adminApi, type AdminOrder } from "../features/admin/api.ts";
import { Button } from "../shared/ui/Button.tsx";
import { Card } from "../shared/ui/Card.tsx";
import { StageTimeline } from "../features/stages/components/StageTimeline.tsx";
import { StageDetailsDrawer } from "../features/stages/components/StageDetailsDrawer.tsx";
import { StageInventoryManager } from "../features/admin/components/StageInventoryManager.tsx";
import { useOrderStages } from "../features/stages/useOrderStages.ts";

type StageFormState = {
  name: string;
  description: string;
  assignedTo: string;
  orderIndex: number;
};

type EditingStage = {
  id: string;
  name: string;
  description: string;
} | null;

type FilterStatus = "all" | "new" | "in_progress" | "completed";
type SortOption = "newest" | "oldest" | "progress";

export const AdminPage = () => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useAdminOrders();
  const { data: mechanics = [] } = useMechanics();
  const markOrderViewed = useMarkOrderViewed();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState<StageFormState>({ name: "", description: "", assignedTo: "", orderIndex: 0 });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStage, setEditingStage] = useState<EditingStage>(null);
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null);

  const { data: orderStages = [], isLoading: isStagesLoading } = useOrderStages(
    selectedOrder?.id ?? "",
    Boolean(selectedOrder),
  );

  useEffect(() => {
    if (selectedOrder) {
      markOrderViewed.mutate(selectedOrder.id);
      setStageForm((prev) => ({
        ...prev,
        orderIndex: orderStages.length,
      }));
    }
  }, [selectedOrder?.id, orderStages.length]);

  const createStage = useMutation({
    mutationFn: (payload: { name: string; description?: string; assignedTo?: string; orderIndex?: number }) =>
      adminApi.createStage(selectedOrder!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", selectedOrder?.id] });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
      setStageForm({ name: "", description: "", assignedTo: "", orderIndex: orderStages.length + 1 });
    },
  });

  const updateStage = useMutation({
    mutationFn: ({
      stageId,
      data,
    }: {
      stageId: string;
      data: { status?: string; assignedTo?: string | null; orderIndex?: number; name?: string; description?: string };
    }) => adminApi.updateStage(selectedOrder!.id, stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", selectedOrder?.id] });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
      setEditingStage(null);
    },
  });

  const deleteStage = useMutation({
    mutationFn: (stageId: string) => adminApi.deleteStage(selectedOrder!.id, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", selectedOrder?.id] });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
      setDeletingStageId(null);
      if (activeStageId === deletingStageId) {
        setActiveStageId(null);
      }
    },
  });

  const totalStages = orders.reduce((acc, order) => acc + (order.stats?.total ?? 0), 0);
  const completedStages = orders.reduce((acc, order) => acc + (order.stats?.done ?? 0), 0);
  const inProgressOrders = orders.filter((order) => order.status === "in_progress").length;
  const newOrders = orders.filter((order) => order.isNewForAdmin).length;

  // Фильтрация и сортировка заказов
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Фильтр по статусу
        if (filterStatus === "new") return order.isNewForAdmin;
        if (filterStatus === "in_progress") return order.status === "in_progress";
        if (filterStatus === "completed") return order.status === "completed";
        return true;
      })
      .filter((order) => {
        // Поиск
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          order.title?.toLowerCase().includes(query) ||
          order.customer?.fullName?.toLowerCase().includes(query) ||
          order.vehicleInfo?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Сортировка
        if (sortOption === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortOption === "progress") {
          const progressA = a.stats?.total ? (a.stats.done ?? 0) / a.stats.total : 0;
          const progressB = b.stats?.total ? (b.stats.done ?? 0) / b.stats.total : 0;
          return progressB - progressA;
        }
        // По умолчанию: сначала новые
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orders, filterStatus, searchQuery, sortOption]);

  const handleCreateStage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOrder || !stageForm.name.trim()) {
      return;
    }
    createStage.mutate({
      name: stageForm.name.trim(),
      description: stageForm.description || undefined,
      assignedTo: stageForm.assignedTo || undefined,
      orderIndex: stageForm.orderIndex,
    });
  };

  const handleAssign = (stageId: string, mechanicId: string) => {
    updateStage.mutate({ stageId, data: { assignedTo: mechanicId || null } });
  };

  const handleStageStatus = (stageId: string, status: string) => {
    updateStage.mutate({ stageId, data: { status } });
  };

  const handleOrderIndexChange = (stageId: string, orderIndex: number) => {
    updateStage.mutate({ stageId, data: { orderIndex } });
  };

  const closeManager = () => {
    setSelectedOrder(null);
    setActiveStageId(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">⚙️</span>
            <h1 className="text-4xl font-black text-gradient">Панель администратора</h1>
          </div>
          <p className="text-dark-300 text-lg">Контроль этапов, назначение механиков и уведомления клиентов</p>
        </div>
        <Button
          variant="gradient"
          onClick={() => {
            if (orders.length > 0) {
              setSelectedOrder(orders[0]);
            }
          }}
          disabled={orders.length === 0}
        >
          Управлять этапами
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card variant="glass" className="bg-gradient-to-br from-primary-900/20 to-primary-800/20 border-primary-700/30">
          <div className="space-y-2">
            <div className="text-sm font-medium text-dark-300">Активные заказы</div>
            <div className="text-3xl font-black text-primary-400">{orders.length}</div>
          </div>
        </Card>
        <Card variant="glass" className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30">
          <div className="space-y-2">
            <div className="text-sm font-medium text-dark-300">В работе</div>
            <div className="text-3xl font-black text-blue-400">{inProgressOrders}</div>
          </div>
        </Card>
        <Card variant="glass" className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 border-emerald-700/30">
          <div className="space-y-2">
            <div className="text-sm font-medium text-dark-300">Завершено этапов</div>
            <div className="text-3xl font-black text-emerald-400">
              {completedStages}/{totalStages || 1}
            </div>
          </div>
        </Card>
        <Card variant="glass" className="bg-gradient-to-br from-accent-900/20 to-accent-800/20 border-accent-700/30">
          <div className="space-y-2">
            <div className="text-sm font-medium text-dark-300">Новые заказы</div>
            <div className="text-3xl font-black text-accent-400">{newOrders}</div>
          </div>
        </Card>
      </div>

      <Card variant="glass">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-50">Заказы</h2>
            <span className="text-sm text-dark-400">{filteredOrders.length} из {orders.length}</span>
          </div>

          {/* Фильтры и сортировка */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Вкладки статусов */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "all" as const, label: "Все", count: orders.length },
                { value: "new" as const, label: "Новые", count: newOrders },
                { value: "in_progress" as const, label: "В работе", count: inProgressOrders },
                { value: "completed" as const, label: "Завершённые", count: orders.filter(o => o.status === "completed").length },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-sm font-medium transition-all",
                    filterStatus === tab.value
                      ? "bg-primary-600 text-white"
                      : "bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-dark-100"
                  )}
                >
                  {tab.label}
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-lg bg-dark-900/50 text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Поиск и сортировка */}
            <div className="flex-1 flex gap-3">
              <input
                type="text"
                placeholder="Поиск по названию, клиенту, авто..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 px-3 py-1.5 text-sm placeholder:text-dark-500 focus:border-primary-500 focus:outline-none"
              />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-xl bg-dark-800 border border-dark-700 text-dark-50 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="progress">По прогрессу</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredOrders.length ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const progress = order.stats?.total ? Math.round(((order.stats.done ?? 0) / order.stats.total) * 100) : 0;
                const serviceTypeLabels: Record<string, string> = {
                  diagnostics: "Диагностика",
                  repair: "Ремонт",
                  maintenance: "ТО",
                  other: order.serviceTypeOther || "Другое",
                };
                const vehicleFullInfo = order.vehicleGeneration
                  ? `${order.vehicleGeneration.model.brand.name} ${order.vehicleGeneration.model.name} ${order.vehicleGeneration.name}${order.vehicleYear ? ` (${order.vehicleYear})` : ""}`
                  : order.vehicleInfo || "Не указано";
                return (
                  <div
                    key={order.id}
                    className={clsx(
                      "p-4 rounded-2xl bg-dark-800/70 border border-dark-700 hover:border-primary-500/60 transition-all duration-200 flex flex-col gap-3",
                      order.isNewForAdmin && "ring-2 ring-accent-500/50 shadow-accent-500/30 shadow-lg",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-dark-400 uppercase tracking-wide">№ {order.id.slice(0, 6)}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary-900/30 border border-primary-700/50 text-xs text-primary-400">
                            {serviceTypeLabels[order.serviceType] || order.serviceType}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-dark-50 truncate">{order.title}</h3>
                      </div>
                      {order.isNewForAdmin && <span className="status-badge status-in-progress shrink-0">NEW</span>}
                    </div>

                    {/* Автомобиль */}
                    <div className="flex items-center gap-2 text-sm text-dark-300">
                      <span className="text-base">🚗</span>
                      <span className="truncate">{vehicleFullInfo}</span>
                    </div>

                    {/* Описание/комментарий */}
                    {order.description && (
                      <div className="p-2 rounded-lg bg-dark-900/50 border border-dark-700">
                        <p className="text-xs text-dark-400 line-clamp-2">{order.description}</p>
                      </div>
                    )}

                    {/* Прогресс */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-dark-400 mb-1">
                        <span>
                          {order.stats?.done ?? 0} / {order.stats?.total ?? 0} этапов
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    {/* Клиент */}
                    <div className="flex items-center justify-between text-xs text-dark-400 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">👤</span>
                        <span className="truncate">{order.customer?.fullName}</span>
                        {order.customer?.phone && (
                          <a
                            href={`tel:${order.customer.phone}`}
                            className="shrink-0 text-primary-400 hover:text-primary-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞
                          </a>
                        )}
                      </div>
                      <span className="shrink-0">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                      }}
                    >
                      Управлять
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : orders.length > 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-lg font-medium text-dark-300">Ничего не найдено</p>
              <p className="text-sm text-dark-400 mt-2">Попробуйте изменить фильтры или поисковый запрос</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setFilterStatus("all");
                  setSearchQuery("");
                }}
              >
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <div className="text-center text-dark-400 py-6">Активных заказов нет</div>
          )}
        </div>
      </Card>

      {selectedOrder && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-start justify-center p-6">
          <div className="w-full max-w-5xl bg-dark-900 rounded-3xl border border-dark-700 shadow-2xl flex flex-col max-h-full">
            <div className="p-6 border-b border-dark-700 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wide">Управление заказом</p>
                <h3 className="text-2xl font-bold text-dark-50">{selectedOrder.title}</h3>
                <p className="text-sm text-dark-400 mt-1">Клиент: {selectedOrder.customer?.fullName}</p>
              </div>
              <Button variant="ghost" onClick={closeManager}>
                Закрыть
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card variant="glass">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-dark-50">Этапы</h4>
                        <p className="text-xs text-dark-400 mt-1">Нажмите на этап для управления комплектующими</p>
                      </div>
                      {isStagesLoading && <span className="text-xs text-dark-400">Загрузка...</span>}
                    </div>
                    <StageTimeline
                      stages={orderStages}
                      onStageClick={(stageId) => setActiveStageId(stageId)}
                      selectedStageId={activeStageId}
                      showNewIndicator
                    />
                  </div>
                </Card>

                <Card variant="glass">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-dark-50">Управление этапами</h4>
                      <span className="text-xs text-dark-400">{mechanics.length} механиков</span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-auto pr-2">
                      {orderStages.map((stage) => (
                        <div key={stage.id} className="p-3 rounded-2xl bg-dark-800/70 border border-dark-700 space-y-3">
                          {/* Редактирование названия и описания */}
                          {editingStage?.id === stage.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingStage.name}
                                onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                                className="w-full bg-dark-900 border border-dark-600 rounded-xl text-sm text-dark-50 px-3 py-2"
                                placeholder="Название этапа"
                              />
                              <textarea
                                value={editingStage.description}
                                onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                                className="w-full bg-dark-900 border border-dark-600 rounded-xl text-sm text-dark-50 px-3 py-2"
                                placeholder="Описание (опционально)"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="gradient"
                                  onClick={() => updateStage.mutate({
                                    stageId: stage.id,
                                    data: { name: editingStage.name, description: editingStage.description }
                                  })}
                                  isLoading={updateStage.isPending}
                                >
                                  Сохранить
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingStage(null)}
                                >
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-dark-50">{stage.name}</p>
                                {stage.description && (
                                  <p className="text-xs text-dark-400 mt-1 line-clamp-2">{stage.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingStage({ id: stage.id, name: stage.name, description: stage.description || "" })}
                                  className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-200 transition-colors"
                                  title="Редактировать"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingStageId(stage.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-900/30 text-dark-400 hover:text-red-400 transition-colors"
                                  title="Удалить"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Подтверждение удаления */}
                          {deletingStageId === stage.id && (
                            <div className="p-2 rounded-xl bg-red-900/20 border border-red-700/50">
                              <p className="text-xs text-red-300 mb-2">Удалить этап "{stage.name}"? Комплектующие будут возвращены на склад.</p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="!border-red-600 !text-red-400 hover:!bg-red-900/30"
                                  onClick={() => deleteStage.mutate(stage.id)}
                                  isLoading={deleteStage.isPending}
                                >
                                  Удалить
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeletingStageId(null)}
                                >
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Назначение механика */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-dark-400">Механик:</span>
                            <select
                              value={stage.mechanic?.id ?? ""}
                              onChange={(event) => handleAssign(stage.id, event.target.value)}
                              className="flex-1 bg-dark-900 border border-dark-600 rounded-xl text-sm text-dark-50 px-2 py-1"
                            >
                              <option value="">Не назначен</option>
                              {mechanics.map((mechanic) => (
                                <option key={mechanic.id} value={mechanic.id}>
                                  {mechanic.fullName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Порядок и статус */}
                          <div className="flex items-center gap-2 text-xs text-dark-400 flex-wrap">
                            <label className="flex items-center gap-1">
                              №
                              <input
                                type="number"
                                min={0}
                                value={stage.orderIndex ?? 0}
                                onChange={(event) => handleOrderIndexChange(stage.id, Number(event.target.value))}
                                className="w-16 bg-dark-900 border border-dark-600 rounded-lg px-2 py-1 text-dark-50"
                              />
                            </label>
                            <Button
                              size="sm"
                              variant={stage.status === "done" ? "gradient" : "outline"}
                              onClick={() => handleStageStatus(stage.id, stage.status === "done" ? "pending" : "done")}
                            >
                              {stage.status === "done" ? "Сбросить" : "Завершить"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <Card variant="glass">
                <form className="space-y-4" onSubmit={handleCreateStage}>
                  <h4 className="text-lg font-semibold text-dark-50">Создать этап</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-dark-400">Название</label>
                      <input
                        type="text"
                        value={stageForm.name}
                        onChange={(event) => setStageForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                        placeholder="Например, диагностика"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-dark-400">Назначить механику</label>
                      <select
                        className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                        value={stageForm.assignedTo}
                        onChange={(event) => setStageForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
                      >
                        <option value="">Позже</option>
                        {mechanics.map((mechanic) => (
                          <option key={mechanic.id} value={mechanic.id}>
                            {mechanic.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-dark-400">Описание</label>
                    <textarea
                      value={stageForm.description}
                      onChange={(event) => setStageForm((prev) => ({ ...prev, description: event.target.value }))}
                      rows={3}
                      className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                      placeholder="Что нужно сделать, какие материалы подготовить..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-dark-400">Порядок</label>
                    <input
                      type="number"
                      min={0}
                      value={stageForm.orderIndex}
                      onChange={(event) => setStageForm((prev) => ({ ...prev, orderIndex: Number(event.target.value) }))}
                      className="w-24 rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                    />
                  </div>
                  <Button type="submit" variant="gradient" isLoading={createStage.isPending}>
                    Создать этап
                  </Button>
                </form>
              </Card>

              {activeStageId ? (
                <StageInventoryManager
                  stageId={activeStageId}
                  orderId={selectedOrder.id}
                  vehicleInfo={
                    selectedOrder.vehicleGeneration
                      ? {
                          vehicleBrandId: selectedOrder.vehicleGeneration.model?.brand?.id,
                          vehicleModelId: selectedOrder.vehicleGeneration.model?.id,
                          vehicleGenerationId: selectedOrder.vehicleGenerationId,
                          vehicleYear: selectedOrder.vehicleYear,
                        }
                      : undefined
                  }
                />
              ) : orderStages.length > 0 ? (
                <Card variant="glass">
                  <div className="text-center text-dark-400 py-8">
                    <div className="text-4xl mb-3">👆</div>
                    <p className="text-lg font-medium text-dark-300">Выберите этап выше</p>
                    <p className="text-sm mt-2">Нажмите на этап в списке, чтобы добавить или управлять комплектующими</p>
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}

      <StageDetailsDrawer
        stageId={activeStageId}
        onClose={() => setActiveStageId(null)}
        vehicleInfo={
          selectedOrder?.vehicleGeneration
            ? {
                vehicleBrandId: selectedOrder.vehicleGeneration.model?.brand?.id,
                vehicleModelId: selectedOrder.vehicleGeneration.model?.id,
                vehicleGenerationId: selectedOrder.vehicleGenerationId,
                vehicleYear: selectedOrder.vehicleYear,
              }
            : undefined
        }
      />
    </div>
  );
};


