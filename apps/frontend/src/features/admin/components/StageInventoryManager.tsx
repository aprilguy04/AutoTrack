import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type OrderStageInventoryItem } from "../api.ts";
import { warehouseApi } from "../../warehouse/api.ts";
import { Button } from "../../../shared/ui/Button.tsx";
import { Card } from "../../../shared/ui/Card.tsx";
import { clsx } from "clsx";

interface StageInventoryManagerProps {
  stageId: string;
  orderId: string;
  vehicleInfo?: {
    vehicleBrandId?: string;
    vehicleModelId?: string;
    vehicleGenerationId?: string;
    vehicleYear?: number;
  };
}

export const StageInventoryManager = ({ stageId, orderId, vehicleInfo }: StageInventoryManagerProps) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isRequired, setIsRequired] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // Получить комплектующие этапа
  const { data: stageItemsData } = useQuery({
    queryKey: ["admin", "stage-inventory", stageId],
    queryFn: () => adminApi.getStageInventoryItems(stageId),
    enabled: !!stageId,
  });

  // Получить совместимые комплектующие
  const { data: compatibleItemsData, isLoading: isLoadingCompatible, error: compatibleError } = useQuery({
    queryKey: ["warehouse", "compatible", vehicleInfo],
    queryFn: () => {
      console.log('Fetching compatible items, vehicleInfo:', vehicleInfo);
      if (!vehicleInfo) {
        return warehouseApi.getInventoryItems({ isActive: true });
      }
      return warehouseApi.getCompatibleInventoryItems({
        vehicleBrandId: vehicleInfo.vehicleBrandId,
        vehicleModelId: vehicleInfo.vehicleModelId,
        vehicleGenerationId: vehicleInfo.vehicleGenerationId,
        vehicleYear: vehicleInfo.vehicleYear,
      });
    },
    enabled: !!stageId,
  });

  const addItemMutation = useMutation({
    mutationFn: (data: { inventoryItemId: string; quantity?: number; isRequired?: boolean; adminNotes?: string }) =>
      adminApi.suggestInventoryForStage(stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stage-inventory", stageId] });
      queryClient.invalidateQueries({ queryKey: ["stages", orderId] });
      setIsAdding(false);
      setSelectedItemId("");
      setQuantity(1);
      setIsRequired(false);
      setAdminNotes("");
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => adminApi.removeStageInventoryItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stage-inventory", stageId] });
      queryClient.invalidateQueries({ queryKey: ["stages", orderId] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantity?: number; isRequired?: boolean; status?: string } }) =>
      adminApi.updateStageInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stage-inventory", stageId] });
      queryClient.invalidateQueries({ queryKey: ["stages", orderId] });
    },
  });

  const stageItems = stageItemsData?.items ?? [];
  const compatibleItems = compatibleItemsData?.items ?? [];

  // Фильтруем комплектующие, которые уже добавлены
  const availableItems = compatibleItems.filter(
    (item) => !stageItems.some((si) => si.inventoryItemId === item.id)
  );

  const handleAddItem = () => {
    if (!selectedItemId) return;
    addItemMutation.mutate({
      inventoryItemId: selectedItemId,
      quantity,
      isRequired,
      adminNotes: adminNotes || undefined,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (confirm("Удалить комплектующее из этапа?")) {
      removeItemMutation.mutate(itemId);
    }
  };

  const handleToggleRequired = (item: OrderStageInventoryItem) => {
    updateItemMutation.mutate({
      id: item.id,
      data: { isRequired: !item.isRequired },
    });
  };

  // Считаем только обязательные комплектующие и те, что выбрал клиент
  const totalCost = stageItems
    .filter((item) => item.isRequired || item.selectedByClient || item.status === "approved")
    .reduce((sum, item) => {
      return sum + (item.unitPrice ? Number(item.unitPrice) * item.quantity : 0);
    }, 0);

  return (
    <Card variant="glass">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-dark-50">Комплектующие для этапа</h4>
            <p className="text-xs text-dark-400 mt-1">
              {vehicleInfo
                ? "Показаны только совместимые с автомобилем клиента"
                : "Показаны все активные комплектующие"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? "Отмена" : "+ Добавить"}
          </Button>
        </div>

        {isAdding && (
          <div className="p-4 rounded-xl bg-dark-800/70 border border-dark-700 space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-dark-400">Выберите комплектующее</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2 text-sm"
                disabled={isLoadingCompatible}
              >
                <option value="">
                  {isLoadingCompatible ? "Загрузка..." : availableItems.length === 0 ? "Нет доступных комплектующих" : "-- Выберите --"}
                </option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.manufacturer && `(${item.manufacturer})`} • {item.stock} {item.unit} на складе
                    {item.price && ` • ${item.price} ₽`}
                  </option>
                ))}
              </select>
              {compatibleError && (
                <p className="text-xs text-red-400">Ошибка загрузки комплектующих</p>
              )}
              {!isLoadingCompatible && availableItems.length === 0 && (
                <p className="text-xs text-yellow-400">
                  {compatibleItems.length === 0
                    ? "В базе нет комплектующих. Добавьте их через раздел 'Склад'"
                    : "Все комплектующие уже добавлены к этому этапу"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Количество</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Тип</label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-primary-600"
                  />
                  <label htmlFor="isRequired" className="text-sm text-dark-300">
                    Обязательное
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-dark-400">Примечание для клиента</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2 text-sm"
                placeholder="Зачем нужно это комплектующее..."
              />
            </div>

            <Button
              size="sm"
              variant="gradient"
              onClick={handleAddItem}
              disabled={!selectedItemId}
              isLoading={addItemMutation.isPending}
            >
              Добавить комплектующее
            </Button>
          </div>
        )}

        {stageItems.length > 0 ? (
          <div className="space-y-2">
            {stageItems.map((item) => {
              const isApproved = item.status === "approved" || item.selectedByClient;
              const isRejected = item.status === "rejected";
              const isPending = item.status === "pending";

              return (
              <div
                key={item.id}
                className={clsx(
                  "p-3 rounded-xl border transition-all",
                  isApproved && "bg-emerald-900/20 border-emerald-700/50",
                  isRejected && "bg-red-900/20 border-red-700/50 opacity-75",
                  isPending && "bg-dark-800/70 border-dark-700"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-dark-50 font-medium">{item.inventoryItem.name}</h5>
                      {item.isRequired && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-900/30 border border-red-700/50 text-xs text-red-400">
                          Обязательно
                        </span>
                      )}
                      {isApproved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-900/30 border border-emerald-700/50 text-xs text-emerald-400">
                          ✓ Выбрано клиентом
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-900/30 border border-red-700/50 text-xs text-red-400">
                          ✗ Отклонено клиентом
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-yellow-900/30 border border-yellow-700/50 text-xs text-yellow-400">
                          ⏳ Ожидает решения
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-dark-400 space-y-1">
                      {item.inventoryItem.description && <p>{item.inventoryItem.description}</p>}
                      <p>
                        Количество: {item.quantity} {item.inventoryItem.unit}
                        {item.unitPrice && ` • Цена: ${item.unitPrice} ₽ • Сумма: ${Number(item.unitPrice) * item.quantity} ₽`}
                      </p>
                      {item.inventoryItem.stock < item.quantity && (
                        <p className="text-red-400">⚠ Недостаточно на складе ({item.inventoryItem.stock} {item.inventoryItem.unit})</p>
                      )}
                      {item.adminNotes && <p className="text-blue-300">💡 {item.adminNotes}</p>}
                      {item.clientNotes && <p className="text-accent-300">💬 Клиент: {item.clientNotes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRequired(item)}
                      className="text-xs px-2 py-1 rounded-lg bg-dark-900 border border-dark-600 text-dark-300 hover:text-primary-400 transition-colors"
                      title={item.isRequired ? "Сделать опциональным" : "Сделать обязательным"}
                    >
                      {item.isRequired ? "⭐" : "☆"}
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-dark-900 border border-dark-600 text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              );
            })}

            {totalCost > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-primary-900/20 border border-primary-700/50 flex items-center justify-between">
                <span className="text-sm text-dark-300">Общая стоимость:</span>
                <span className="text-lg font-bold text-primary-400">{totalCost.toFixed(2)} ₽</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-dark-400 py-6">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-sm">Комплектующие не добавлены</p>
            <p className="text-xs mt-1">Добавьте детали, которые нужны для выполнения этого этапа</p>
          </div>
        )}
      </div>
    </Card>
  );
};
