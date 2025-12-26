import { clsx } from "clsx";
import type { OrderDto } from "../features/orders/useOrders.ts";
import { Card } from "../shared/ui/Card.tsx";

const statusConfig: Record<
  OrderDto["stages"][number]["status"],
  { label: string; className: string; icon: string }
> = {
  pending: {
    label: "Ожидание",
    className: "status-pending",
    icon: "⏳",
  },
  in_progress: {
    label: "В работе",
    className: "status-in-progress",
    icon: "🔧",
  },
  done: {
    label: "Готово",
    className: "status-done",
    icon: "✅",
  },
  blocked: {
    label: "Остановлено",
    className: "status-blocked",
    icon: "⛔",
  },
};

type Props = {
  order: OrderDto;
  onStageClick?: (orderId: string, stageId: string) => void;
};

export const OrderTracker = ({ order, onStageClick }: Props) => {
  const progress = (order.stages.filter((s) => s.status === "done").length / order.stages.length) * 100;

  return (
    <Card variant="glass" hover className="h-full flex flex-col">
      <div className="space-y-4 flex-1">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-dark-50 line-clamp-2">{order.vehicle}</h3>
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <span>🔧</span>
            <span className="font-medium">{order.serviceTypeLabel}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-dark-300">Прогресс</span>
            <span className="font-bold text-primary-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden border border-dark-600">
            <div
              className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-full transition-all duration-500 ease-out shadow-lg shadow-primary-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-2 flex-1">
          <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wide">Этапы</h4>
          <div className="space-y-2">
            {order.stages.map((stage) => {
              const config = statusConfig[stage.status];
              return (
                <button
                  type="button"
                  key={stage.id}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full text-left",
                    stage.status === "done" && "bg-emerald-900/30 border border-emerald-700/50",
                    stage.status === "in_progress" && "bg-blue-900/30 border border-blue-700/50",
                    stage.status === "pending" && "bg-dark-700/50 border border-dark-600/50",
                  )}
                  onClick={() => onStageClick?.(order.id, stage.id)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-xl shadow-lg border border-dark-600">
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-dark-50 text-sm">{stage.name}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={clsx("status-badge text-xs", config.className)}>
                        {config.label}
                      </span>
                      {stage.assignedTo && (
                        <span className="text-xs text-dark-400">👨‍🔧 {stage.assignedTo}</span>
                      )}
                      {/* Placeholder для фото - будет добавлено позже */}
                      {stage.status === "done" && (
                        <span className="text-xs text-dark-500 flex items-center gap-1">
                          📸 Фото
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};


