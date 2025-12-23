import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { useOrders } from "../features/orders/useOrders.ts";
import { OrderTracker } from "../widgets/OrderTracker.tsx";
import { Button } from "../shared/ui/Button.tsx";
import { Card } from "../shared/ui/Card.tsx";
import { StageDetailsDrawer } from "../features/stages/components/StageDetailsDrawer.tsx";

type FilterStatus = "all" | "active" | "completed";

export const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useOrders();
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Обновляем заказы при монтировании компонента
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Фильтрация заказов
  const filteredOrders = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .filter((order) => {
        // Фильтр по статусу
        if (filterStatus === "active") {
          return order.status !== "completed" && order.status !== "cancelled";
        }
        if (filterStatus === "completed") {
          return order.status === "completed";
        }
        return true;
      })
      .filter((order) => {
        // Поиск по названию
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          order.title?.toLowerCase().includes(query) ||
          order.description?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Сортировка: сначала новые
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [data, filterStatus, searchQuery]);

  const orderCounts = useMemo(() => {
    if (!data || !Array.isArray(data)) return { all: 0, active: 0, completed: 0 };

    const active = data.filter((o) => o.status !== "completed" && o.status !== "cancelled").length;
    const completed = data.filter((o) => o.status === "completed").length;

    return { all: data.length, active, completed };
  }, [data]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🚗</span>
            <h1 className="text-4xl font-black text-gradient">Мои заказы</h1>
          </div>
          <p className="text-dark-300 text-lg">Отслеживайте прогресс ремонта в реальном времени</p>
        </div>
        <Button variant="gradient" onClick={() => navigate("/client/orders/new")}>
          + Новый заказ
        </Button>
      </div>

      {/* Фильтры */}
      {data && Array.isArray(data) && data.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Вкладки статусов */}
          <div className="flex gap-2">
            {[
              { value: "all" as const, label: "Все", count: orderCounts.all },
              { value: "active" as const, label: "В процессе", count: orderCounts.active },
              { value: "completed" as const, label: "Завершённые", count: orderCounts.completed },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filterStatus === tab.value
                    ? "bg-primary-600 text-white"
                    : "bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-dark-100"
                )}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 rounded-lg bg-dark-900/50 text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Поиск */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-dark-800 border border-dark-700 text-dark-50 px-4 py-2 text-sm placeholder:text-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="glass">
              <div className="space-y-4">
                <div className="skeleton h-6 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order, index) => (
            <div key={order.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <OrderTracker
                order={order}
                onStageClick={(_, stageId) => {
                  setActiveStageId(stageId);
                }}
              />
            </div>
          ))}
        </div>
      ) : data && Array.isArray(data) && data.length > 0 ? (
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
        <Card variant="glass" className="text-center py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-accent-600/10 opacity-50" />
          <div className="space-y-4 relative z-10">
            <div className="text-7xl animate-bounce" style={{ animationDuration: '2s' }}>🚗</div>
            <h3 className="text-2xl font-bold text-dark-50">Пока нет заказов</h3>
            <p className="text-dark-300">Создайте свой первый заказ на ремонт</p>
            <Button variant="gradient" className="mt-4" onClick={() => navigate("/client/orders/new")}>
              🔧 Создать заказ
            </Button>
          </div>
        </Card>
      )}
      <StageDetailsDrawer stageId={activeStageId} onClose={() => setActiveStageId(null)} allowUpdates={false} />
    </div>
  );
};


