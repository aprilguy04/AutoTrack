import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { useNotifications, useNotificationActions } from "../useNotifications.js";
import { useAuthStore } from "../../../entities/user/store.js";
import { StageDetailsDrawer } from "../../stages/components/StageDetailsDrawer.js";
import type { NotificationMetadata } from "../api.js";

export const NotificationsBell = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: notifications = [] } = useNotifications();
  const { markRead, markAll } = useNotificationActions();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  const unread = notifications.filter((notification) => !notification.isRead).length;

  const parseMetadata = (metadataStr: string | null | undefined): NotificationMetadata | null => {
    if (!metadataStr) return null;
    try {
      return JSON.parse(metadataStr);
    } catch {
      return null;
    }
  };

  const handleNotificationClick = useCallback((notification: typeof notifications[0]) => {
    // Помечаем как прочитанное
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }

    const metadata = parseMetadata(notification.metadata);

    // Если есть stageId и это уведомление о этапе - открываем drawer
    if (metadata?.stageId && ["stage_done", "stage_assigned", "inventory_suggested"].includes(notification.type)) {
      setIsOpen(false);
      setActiveStageId(metadata.stageId);
      return;
    }

    // Переход на соответствующую страницу в зависимости от типа и роли
    if (notification.orderId) {
      setIsOpen(false);

      if (notification.type === "new_order" && user?.role === "admin") {
        navigate("/admin");
      } else if (notification.type === "stage_assigned" && user?.role === "mechanic") {
        navigate("/mechanic");
      } else {
        navigate("/client");
      }
    }
  }, [markRead, navigate, user?.role]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_completed":
        return "✅";
      case "stage_done":
        return "🔧";
      case "new_order":
        return "📋";
      case "stage_assigned":
        return "👷";
      case "inventory_suggested":
        return "🛠️";
      default:
        return "📢";
    }
  };

  const getNotificationLabel = (type: string) => {
    switch (type) {
      case "order_completed":
        return "Заказ завершён";
      case "stage_done":
        return "Этап завершён";
      case "new_order":
        return "Новый заказ";
      case "stage_assigned":
        return "Назначение";
      case "inventory_suggested":
        return "Комплектующие";
      default:
        return "Уведомление";
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={clsx(
          "relative w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          isOpen ? "bg-primary-500/20 text-primary-200" : "bg-dark-800 text-dark-200 hover:bg-dark-700",
        )}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-dark-50">Уведомления</h4>
            {notifications.length > 0 && (
              <button
                type="button"
                className="text-xs text-primary-400 hover:text-primary-300"
                onClick={() => markAll.mutate()}
              >
                Прочитать все
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-dark-400 text-center py-4">Новых уведомлений нет</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto pr-1">
              {notifications.map((notification) => {
                const metadata = parseMetadata(notification.metadata);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={clsx(
                      "p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]",
                      notification.isRead
                        ? "border-dark-700 bg-dark-800/70 hover:bg-dark-800"
                        : "border-primary-600/40 bg-primary-600/10 hover:bg-primary-600/20",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs text-dark-400 mb-1">
                          <span className="font-medium">{getNotificationLabel(notification.type)}</span>
                          <span>{new Date(notification.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </div>
                        <p className="text-sm font-semibold text-dark-50 truncate">{notification.title}</p>
                        <p className="text-sm text-dark-300 truncate">{notification.message}</p>
                        {notification.orderId && (
                          <p className="text-xs text-primary-400 mt-1 flex items-center gap-1">
                            <span>
                              {parseMetadata(notification.metadata)?.stageId ? "Открыть этап" : "Перейти к заказу"}
                            </span>
                            <span>→</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <StageDetailsDrawer
        stageId={activeStageId}
        onClose={() => setActiveStageId(null)}
        allowUpdates={user?.role === "mechanic"}
      />
    </div>
  );
};

