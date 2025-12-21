import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stagesApi, type StageInventoryItem } from "../api.ts";
import { Button } from "../../../shared/ui/Button.tsx";
import { Card } from "../../../shared/ui/Card.tsx";
import { clsx } from "clsx";

interface StageInventoryClientProps {
  stageId: string;
  orderId: string;
}

export const StageInventoryClient = ({ stageId, orderId }: StageInventoryClientProps) => {
  const queryClient = useQueryClient();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [clientNotes, setClientNotes] = useState<Record<string, string>>({});

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["stage-inventory", stageId],
    queryFn: () => stagesApi.getStageInventory(stageId),
    enabled: !!stageId,
  });

  const respondMutation = useMutation({
    mutationFn: ({ itemId, selectedByClient, notes }: { itemId: string; selectedByClient: boolean; notes?: string }) =>
      stagesApi.respondToInventory(itemId, { selectedByClient, clientNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stage-inventory", stageId] });
      queryClient.invalidateQueries({ queryKey: ["stages", orderId] });
      setExpandedItemId(null);
      setClientNotes({});
    },
  });

  const items = inventoryData?.items ?? [];

  // Разделяем на обязательные и опциональные
  const requiredItems = items.filter((item) => item.isRequired);
  const optionalItems = items.filter((item) => !item.isRequired);

  const handleRespond = (item: StageInventoryItem, selectedByClient: boolean) => {
    const notes = clientNotes[item.id] || undefined;
    respondMutation.mutate({ itemId: item.id, selectedByClient, notes });
  };

  const totalCost = items
    .filter((item) => item.selectedByClient || item.isRequired)
    .reduce((sum, item) => {
      return sum + (item.unitPrice ? Number(item.unitPrice) * item.quantity : 0);
    }, 0);

  const pendingCount = items.filter((item) => item.status === "pending" && !item.isRequired).length;

  if (isLoading) {
    return (
      <Card variant="glass">
        <div className="text-center text-dark-400 py-6">Загрузка комплектующих...</div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card variant="glass">
        <div className="text-center text-dark-400 py-6">
          <div className="text-3xl mb-2">📦</div>
          <p>Для этого этапа не предложено комплектующих</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-dark-50">Необходимые комплектующие</h4>
            <p className="text-xs text-dark-400 mt-1">
              Администратор предложил комплектующие для выполнения этого этапа
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-yellow-900/30 border border-yellow-700/50 text-sm text-yellow-400">
              {pendingCount} требует ответа
            </span>
          )}
        </div>

        {/* Обязательные комплектующие */}
        {requiredItems.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-900/30 border border-red-700/50 text-xs text-red-400">
                Обязательные
              </span>
              <span className="text-dark-500">({requiredItems.length})</span>
            </h5>
            {requiredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-gradient-to-br from-red-900/10 to-red-800/10 border border-red-700/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="text-dark-50 font-semibold">{item.inventoryItem.name}</h5>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-900/30 border border-red-700/50 text-xs text-red-400">
                        ⭐ Обязательно
                      </span>
                    </div>
                    {item.inventoryItem.description && (
                      <p className="text-sm text-dark-400 mb-2">{item.inventoryItem.description}</p>
                    )}
                    <div className="text-sm text-dark-300 space-y-1">
                      <p>
                        Количество: {item.quantity} {item.inventoryItem.unit}
                        {item.unitPrice && (
                          <span className="ml-3">
                            • Цена: <span className="text-primary-400 font-medium">{item.unitPrice} ₽</span>
                            {item.quantity > 1 && (
                              <>
                                {" "}
                                • Сумма:{" "}
                                <span className="text-primary-400 font-medium">
                                  {(Number(item.unitPrice) * item.quantity).toFixed(2)} ₽
                                </span>
                              </>
                            )}
                          </span>
                        )}
                      </p>
                      {item.inventoryItem.manufacturer && (
                        <p className="text-xs">
                          Производитель: <span className="text-dark-200">{item.inventoryItem.manufacturer}</span>
                        </p>
                      )}
                      {item.adminNotes && (
                        <div className="mt-2 p-2 rounded-lg bg-blue-900/20 border border-blue-700/50">
                          <p className="text-xs text-blue-300">💡 <strong>Администратор:</strong> {item.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Опциональные комплектующие */}
        {optionalItems.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-900/30 border border-blue-700/50 text-xs text-blue-400">
                Опциональные
              </span>
              <span className="text-dark-500">({optionalItems.length})</span>
            </h5>
            {optionalItems.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const isPending = item.status === "pending";
              const isApproved = item.selectedByClient;
              const isRejected = !item.selectedByClient && item.status === "rejected";

              return (
                <div
                  key={item.id}
                  className={clsx(
                    "p-4 rounded-xl border transition-all",
                    isApproved && "bg-emerald-900/20 border-emerald-700/50",
                    isRejected && "bg-dark-800/50 border-dark-700 opacity-60",
                    isPending && "bg-dark-800/70 border-yellow-700/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-dark-50 font-semibold">{item.inventoryItem.name}</h5>
                        {isApproved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-900/30 border border-emerald-700/50 text-xs text-emerald-400">
                            ✓ Выбрано
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-900/30 border border-red-700/50 text-xs text-red-400">
                            ✗ Отклонено
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-yellow-900/30 border border-yellow-700/50 text-xs text-yellow-400">
                            ⏳ Ожидает решения
                          </span>
                        )}
                      </div>
                      {item.inventoryItem.description && (
                        <p className="text-sm text-dark-400 mb-2">{item.inventoryItem.description}</p>
                      )}
                      <div className="text-sm text-dark-300 space-y-1">
                        <p>
                          Количество: {item.quantity} {item.inventoryItem.unit}
                          {item.unitPrice && (
                            <span className="ml-3">
                              • Цена: <span className="text-primary-400 font-medium">{item.unitPrice} ₽</span>
                              {item.quantity > 1 && (
                                <>
                                  {" "}
                                  • Сумма:{" "}
                                  <span className="text-primary-400 font-medium">
                                    {(Number(item.unitPrice) * item.quantity).toFixed(2)} ₽
                                  </span>
                                </>
                              )}
                            </span>
                          )}
                        </p>
                        {item.inventoryItem.manufacturer && (
                          <p className="text-xs">
                            Производитель: <span className="text-dark-200">{item.inventoryItem.manufacturer}</span>
                          </p>
                        )}
                        {item.adminNotes && (
                          <div className="mt-2 p-2 rounded-lg bg-blue-900/20 border border-blue-700/50">
                            <p className="text-xs text-blue-300">💡 <strong>Администратор:</strong> {item.adminNotes}</p>
                          </div>
                        )}
                        {item.clientNotes && (
                          <div className="mt-2 p-2 rounded-lg bg-accent-900/20 border border-accent-700/50">
                            <p className="text-xs text-accent-300">💬 <strong>Ваш комментарий:</strong> {item.clientNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Форма ответа */}
                      {isExpanded && isPending && (
                        <div className="mt-3 p-3 rounded-lg bg-dark-900/70 border border-dark-600 space-y-3">
                          <div className="space-y-2">
                            <label className="text-xs text-dark-400">Комментарий (необязательно)</label>
                            <textarea
                              value={clientNotes[item.id] || ""}
                              onChange={(e) => setClientNotes({ ...clientNotes, [item.id]: e.target.value })}
                              rows={2}
                              className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2 text-sm"
                              placeholder="Ваш комментарий к этому комплектующему..."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="gradient"
                              onClick={() => handleRespond(item, true)}
                              isLoading={respondMutation.isPending}
                            >
                              ✓ Принять
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespond(item, false)}
                              isLoading={respondMutation.isPending}
                              className="text-red-400 border-red-700/50 hover:bg-red-900/20"
                            >
                              ✗ Отклонить
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setExpandedItemId(null)}>
                              Отмена
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Кнопка ответа */}
                  {!isExpanded && isPending && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedItemId(item.id)}
                        className="w-full"
                      >
                        Ответить на предложение
                      </Button>
                    </div>
                  )}

                  {/* Кнопка изменить решение */}
                  {!isPending && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedItemId(item.id)}
                        className="text-xs"
                      >
                        Изменить решение
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Итоговая стоимость */}
        {totalCost > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary-900/20 to-accent-900/20 border border-primary-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-400">Общая стоимость комплектующих</p>
                <p className="text-xs text-dark-500 mt-1">
                  Включая обязательные и выбранные опциональные
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gradient">{totalCost.toFixed(2)} ₽</div>
              </div>
            </div>
          </div>
        )}

        {/* Информация о статусе */}
        {pendingCount === 0 && optionalItems.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/50">
            <p className="text-sm text-emerald-300">
              ✓ Вы ответили на все предложения. Механик может приступить к работе.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
