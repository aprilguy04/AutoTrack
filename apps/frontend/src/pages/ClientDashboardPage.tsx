import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../features/orders/useOrders.ts";
import { OrderTracker } from "../widgets/OrderTracker.tsx";
import { Button } from "../shared/ui/Button.tsx";
import { Card } from "../shared/ui/Card.tsx";
import { StageDetailsDrawer } from "../features/stages/components/StageDetailsDrawer.tsx";

export const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useOrders();
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  // Обновляем заказы при монтировании компонента
  useEffect(() => {
    refetch();
  }, [refetch]);

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
      ) : (data && Array.isArray(data) && data.length > 0) ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((order, index) => (
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


