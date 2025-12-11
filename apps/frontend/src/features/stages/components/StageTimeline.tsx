import { clsx } from "clsx";
import type { Order } from "../../orders/api.js";

const STATUS_CONFIG: Record<
  Order["stages"][number]["status"],
  { label: string; color: string; icon: string }
> = {
  pending: { label: "Ожидает", color: "bg-dark-600 text-dark-50", icon: "⏳" },
  in_progress: { label: "В работе", color: "bg-blue-600/20 text-blue-200", icon: "🔧" },
  done: { label: "Готово", color: "bg-emerald-600/20 text-emerald-200", icon: "✅" },
  blocked: { label: "Блок", color: "bg-red-600/20 text-red-200", icon: "⚠️" },
};

type StageTimelineProps = {
  stages?: Order["stages"];
  onStageClick?: (stageId: string) => void;
  selectedStageId?: string | null;
  showNewIndicator?: boolean;
};

export const StageTimeline = ({ stages = [], onStageClick, selectedStageId, showNewIndicator = false }: StageTimelineProps) => {
  const sorted = [...stages].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  return (
    <div className="space-y-3">
      {sorted.map((stage) => {
        const config = STATUS_CONFIG[stage.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
        const isNew = showNewIndicator && !stage.lastViewedAt && stage.status !== "done";

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onStageClick?.(stage.id)}
            className={clsx(
              "w-full text-left p-4 rounded-2xl border transition-all duration-200 bg-dark-800/70 hover:bg-dark-700/80",
              selectedStageId === stage.id ? "border-primary-500/80 shadow-primary-500/20 shadow-lg" : "border-dark-600/40",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{config.icon}</span>
                <div>
                  <p className="font-semibold text-dark-50">{stage.name}</p>
                  <p className="text-xs text-dark-400">Порядок: {stage.orderIndex ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx("px-3 py-1 rounded-full text-xs font-semibold", config.color)}>{config.label}</span>
                {isNew && <span className="text-xs font-bold text-accent-400 animate-pulse">NEW</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-dark-400 flex-wrap">
              {stage.mechanic && (
                <span className="flex items-center gap-1">
                  <span>👨‍🔧</span>
                  <span>{stage.mechanic.fullName}</span>
                </span>
              )}
              {stage.comments && stage.comments.length > 0 && (
                <span className="flex items-center gap-1">
                  💬 <span>{stage.comments.length}</span>
                </span>
              )}
              {stage.attachments && stage.attachments.length > 0 && (
                <span className="flex items-center gap-1">
                  📎 <span>{stage.attachments.length}</span>
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

