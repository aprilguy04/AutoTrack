import { useEffect, useState } from "react";
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

export const AdminPage = () => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useAdminOrders();
  const { data: mechanics = [] } = useMechanics();
  const markOrderViewed = useMarkOrderViewed();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState<StageFormState>({ name: "", description: "", assignedTo: "", orderIndex: 0 });

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
      data: { status?: string; assignedTo?: string | null; orderIndex?: number };
    }) => adminApi.updateStage(selectedOrder!.id, stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", selectedOrder?.id] });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
    },
  });

  const totalStages = orders.reduce((acc, order) => acc + (order.stats?.total ?? 0), 0);
  const completedStages = orders.reduce((acc, order) => acc + (order.stats?.done ?? 0), 0);
  const inProgressOrders = orders.filter((order) => order.status === "in_progress").length;
  const newOrders = orders.filter((order) => order.isNewForAdmin).length;

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
            <span className="text-sm text-dark-400">{orders.length} активных</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : orders.length ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orders.map((order) => {
                const progress = order.stats?.total ? Math.round(((order.stats.done ?? 0) / order.stats.total) * 100) : 0;
                return (
                  <div
                    key={order.id}
                    className={clsx(
                      "p-4 rounded-2xl bg-dark-800/70 border border-dark-700 hover:border-primary-500/60 transition-all duration-200 flex flex-col gap-3",
                      order.isNewForAdmin && "ring-2 ring-accent-500/50 shadow-accent-500/30 shadow-lg",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-dark-400 uppercase tracking-wide">№ {order.id.slice(0, 6)}</p>
                        <h3 className="text-lg font-semibold text-dark-50">{order.title}</h3>
                        <p className="text-sm text-dark-400 mt-1">🚗 {order.vehicleInfo || "Авто из каталога"}</p>
                      </div>
                      {order.isNewForAdmin && <span className="status-badge status-in-progress">NEW</span>}
                    </div>
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
                    <div className="flex items-center justify-between text-xs text-dark-400">
                      <span>Клиент: {order.customer?.fullName}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
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
          ) : (
            <div className="text-center text-dark-400 py-6">Активных заказов нет</div>
          )}
        </div>
      </Card>

      {selectedOrder && (
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
                      <h4 className="text-lg font-semibold text-dark-50">Назначения</h4>
                      <span className="text-xs text-dark-400">{mechanics.length} механиков</span>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-auto pr-2">
                      {orderStages.map((stage) => (
                        <div key={stage.id} className="p-3 rounded-2xl bg-dark-800/70 border border-dark-700 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-dark-50">{stage.name}</p>
                            <select
                              value={stage.mechanic?.id ?? ""}
                              onChange={(event) => handleAssign(stage.id, event.target.value)}
                              className="bg-dark-900 border border-dark-600 rounded-xl text-sm text-dark-50 px-2 py-1"
                            >
                              <option value="">Без механика</option>
                              {mechanics.map((mechanic) => (
                                <option key={mechanic.id} value={mechanic.id}>
                                  {mechanic.fullName}
                                </option>
                              ))}
                            </select>
                          </div>
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
        </div>
      )}

      <StageDetailsDrawer stageId={activeStageId} onClose={() => setActiveStageId(null)} />
    </div>
  );
};


