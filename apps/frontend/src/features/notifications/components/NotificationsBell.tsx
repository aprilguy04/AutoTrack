import { useState } from "react";
import { clsx } from "clsx";
import { useNotifications, useNotificationActions } from "../useNotifications.js";

export const NotificationsBell = () => {
  const { data: notifications = [] } = useNotifications();
  const { markRead, markAll } = useNotificationActions();
  const [isOpen, setIsOpen] = useState(false);

  const unread = notifications.filter((notification) => !notification.isRead).length;

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
        <div className="absolute right-0 mt-3 w-80 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
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
            <div className="space-y-2 max-h-80 overflow-auto pr-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={clsx(
                    "p-3 rounded-xl border",
                    notification.isRead ? "border-dark-700 bg-dark-800/70" : "border-primary-600/40 bg-primary-600/10",
                  )}
                >
                  <div className="flex items-center justify-between text-xs text-dark-400 mb-1">
                    <span>{notification.type === "order_completed" ? "Заказ" : "Этап"}</span>
                    <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-semibold text-dark-50">{notification.title}</p>
                  <p className="text-sm text-dark-300">{notification.message}</p>
                  {!notification.isRead && (
                    <button
                      type="button"
                      className="text-xs text-primary-400 mt-2"
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      Отметить прочитанным
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

