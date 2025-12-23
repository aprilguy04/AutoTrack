import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { useAssignedOrders } from "../features/mechanic/useAssignedOrders.ts";
import { useStageMutations } from "../features/stages/useOrderStages.ts";
import { Button } from "../shared/ui/Button.tsx";
import { Card } from "../shared/ui/Card.tsx";
import { StageDetailsDrawer } from "../features/stages/components/StageDetailsDrawer.tsx";

type FilterStatus = "all" | "new" | "in_progress" | "pending";
type SortOption = "newest" | "oldest" | "order";

export const MechanicPage = () => {
  const { data: orders = [], isLoading } = useAssignedOrders();
  const { updateStatus } = useStageMutations();
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const tasks = useMemo(() => {
    return orders.flatMap((order) =>
      (order.assignedStages || [])
        .filter((stage) => stage.status !== "done")
        .map((stage) => ({
          orderId: order.id,
          orderTitle: order.title,
          vehicle: order.vehicleInfo || order.title,
          stage,
          createdAt: stage.createdAt,
        })),
    );
  }, [orders]);

  // Фильтрация и сортировка задач
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Фильтр по статусу
        if (filterStatus === "new") return !task.stage.lastViewedAt;
        if (filterStatus === "in_progress") return task.stage.status === "in_progress";
        if (filterStatus === "pending") return task.stage.status === "pending";
        return true;
      })
      .filter((task) => {
        // Поиск
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          task.stage.name?.toLowerCase().includes(query) ||
          task.orderTitle?.toLowerCase().includes(query) ||
          task.vehicle?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Сортировка
        if (sortOption === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortOption === "order") {
          return (a.stage.orderIndex ?? 0) - (b.stage.orderIndex ?? 0);
        }
        // По умолчанию: сначала новые
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [tasks, filterStatus, searchQuery, sortOption]);

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

      {/* Фильтры и сортировка */}
      {tasks.length > 0 && (
        <Card variant="glass">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Вкладки статусов */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "all" as const, label: "Все", count: tasks.length },
                { value: "new" as const, label: "Новые", count: newTasks },
                { value: "in_progress" as const, label: "В работе", count: inProgressCount },
                { value: "pending" as const, label: "Ожидают", count: pendingCount },
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
                placeholder="Поиск по этапу, заказу, авто..."
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
                <option value="order">По порядку</option>
              </select>
            </div>
          </div>
        </Card>
      )}

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
      ) : filteredTasks.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task, index) => (
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
      ) : tasks.length > 0 ? (
        <Card variant="glass" className="text-center py-8">
          <div className="space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="text-xl font-bold text-dark-50">Ничего не найдено</h3>
            <p className="text-dark-400">Попробуйте изменить фильтры или поисковый запрос</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setSearchQuery("");
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        </Card>
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
