import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { useAssignedOrders } from "../features/mechanic/useAssignedOrders.ts";
import { useStageMutations } from "../features/stages/useOrderStages.ts";
import { Button } from "../shared/ui/Button.tsx";
import { Card } from "../shared/ui/Card.tsx";
import { StageDetailsDrawer } from "../features/stages/components/StageDetailsDrawer.tsx";

export const MechanicPage = () => {
  const { data: orders = [], isLoading } = useAssignedOrders();
  const { updateStatus } = useStageMutations();
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  const tasks = useMemo(() => {
    return orders.flatMap((order) =>
      (order.assignedStages || [])
        .filter((stage) => stage.status !== "done")
        .map((stage) => ({
          orderId: order.id,
          orderTitle: order.title,
          vehicle: order.vehicleInfo || order.title,
          stage,
        })),
    );
  }, [orders]);

  const inProgressCount = tasks.filter((task) => task.stage.status === "in_progress").length;
  const pendingCount = tasks.filter((task) => task.stage.status === "pending").length;
  const newTasks = tasks.filter((task) => !task.stage.lastViewedAt).length;

  const handleQuickAction = (task: (typeof tasks)[number]) => {
    const nextStatus = task.stage.status === "pending" ? "in_progress" : "done";
    updateStatus.mutate({ stageId: task.stage.id, status: nextStatus });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🔧</span>
            <h1 className="text-4xl font-black text-gradient">Панель механика</h1>
          </div>
          <p className="text-dark-300 text-lg">Назначенные этапы и прогресс выполнения</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <Card variant="glass" className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30">
            <div className="space-y-2">
              <div className="text-sm font-medium text-dark-300">Всего задач</div>
              <div className="text-3xl font-black text-blue-400">{tasks.length}</div>
            </div>
          </Card>
          <Card variant="glass" className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 border-amber-700/30">
            <div className="space-y-2">
              <div className="text-sm font-medium text-dark-300">В работе</div>
              <div className="text-3xl font-black text-amber-400">{inProgressCount}</div>
            </div>
          </Card>
          <Card variant="glass" className="bg-gradient-to-br from-dark-700/30 to-dark-600/30 border-dark-600/50">
            <div className="space-y-2">
              <div className="text-sm font-medium text-dark-300">Ожидают</div>
              <div className="text-3xl font-black text-dark-300">{pendingCount}</div>
            </div>
          </Card>
          <Card variant="glass" className="bg-gradient-to-br from-primary-900/20 to-primary-800/20 border-primary-700/30">
            <div className="space-y-2">
              <div className="text-sm font-medium text-dark-300">Новые</div>
              <div className="text-3xl font-black text-primary-400">{newTasks}</div>
            </div>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="glass">
              <div className="space-y-4">
                <div className="skeleton h-6 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-10 w-full rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : tasks.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <Card
              key={task.stage.id}
              variant="glass"
              hover
              className={clsx(
                "animate-fade-in border border-dark-600/50",
                task.stage.status === "in_progress" && "ring-2 ring-blue-500/40",
                !task.stage.lastViewedAt && "ring-2 ring-accent-500/50",
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-dark-50 line-clamp-2">{task.stage.name}</h3>
                    <span
                      className={clsx(
                        "status-badge text-xs flex-shrink-0",
                        task.stage.status === "in_progress" && "status-in-progress",
                        task.stage.status === "pending" && "status-pending",
                      )}
                    >
                      {task.stage.status === "in_progress" ? "🔧 В работе" : "⏳ Ожидает"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-dark-300">
                    <div className="flex items-center gap-2">
                      <span>📋</span>
                      <span className="font-medium">{task.orderTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🚗</span>
                      <span>{task.vehicle}</span>
                    </div>
                  </div>
                  {!task.stage.lastViewedAt && (
                    <span className="text-xs font-bold text-accent-400 bg-accent-500/10 px-2 py-1 rounded-lg inline-block">
                      Новый этап
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {task.stage.status !== "done" && (
                    <Button
                      variant={task.stage.status === "in_progress" ? "gradient" : "primary"}
                      className="flex-1"
                      onClick={() => handleQuickAction(task)}
                      isLoading={updateStatus.isPending && updateStatus.variables?.stageId === task.stage.id}
                    >
                      {task.stage.status === "in_progress" ? "✅ Завершить" : "▶️ Начать"}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setActiveStageId(task.stage.id)}>
                    Подробнее
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="glass" className="text-center py-12">
          <div className="space-y-4">
            <div className="text-6xl">🎉</div>
            <h3 className="text-2xl font-bold text-dark-50">Все задачи выполнены!</h3>
            <p className="text-dark-400">Новых назначений пока нет</p>
          </div>
        </Card>
      )}

      <StageDetailsDrawer stageId={activeStageId} onClose={() => setActiveStageId(null)} allowUpdates />
    </div>
  );
};
