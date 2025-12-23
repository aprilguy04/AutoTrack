import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseApi } from "../api.ts";
import { Button } from "../../../shared/ui/Button.tsx";
import { Card } from "../../../shared/ui/Card.tsx";
import { CompatibilityManager } from "./CompatibilityManager.tsx";

interface InventoryItemDetailsProps {
  itemId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export const InventoryItemDetails = ({ itemId, onClose, onEdit, onDelete }: InventoryItemDetailsProps) => {
  const queryClient = useQueryClient();
  const [showCompatibility, setShowCompatibility] = useState(false);

  const { data: itemData, isLoading } = useQuery({
    queryKey: ["warehouse", "item", itemId],
    queryFn: () => warehouseApi.getInventoryItemById(itemId),
  });

  const removeCompatibilityMutation = useMutation({
    mutationFn: (compatibilityId: string) => warehouseApi.removeCompatibility(compatibilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "item", itemId] });
    },
  });

  const item = itemData?.item;

  if (isLoading || !item) {
    return createPortal(
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center">
        <div className="text-dark-400">Загрузка...</div>
      </div>,
      document.body
    );
  }

  const stockStatus = item.stock <= item.minStock ? "low" : "normal";

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-start justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-dark-900 rounded-3xl border border-dark-700 shadow-2xl my-8">
        <div className="p-6 border-b border-dark-700 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-dark-50">{item.name}</h3>
              {item.isUniversal ? (
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-900/30 border border-blue-700/50 text-sm text-blue-400">
                  🌐 Универсальное
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-purple-900/30 border border-purple-700/50 text-sm text-purple-400">
                  🎯 Специфичное
                </span>
              )}
              {!item.isActive && (
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-red-900/30 border border-red-700/50 text-sm text-red-400">
                  ⚠ Неактивно
                </span>
              )}
            </div>
            {item.description && <p className="text-sm text-dark-400">{item.description}</p>}
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="glass">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-dark-50">Информация о товаре</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-dark-400">Категория:</span>
                    <span className="text-dark-50 font-medium">{item.category}</span>
                  </div>
                  {item.subcategory && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Подкатегория:</span>
                      <span className="text-dark-50 font-medium">{item.subcategory}</span>
                    </div>
                  )}
                  {item.manufacturer && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Производитель:</span>
                      <span className="text-dark-50 font-medium">{item.manufacturer}</span>
                    </div>
                  )}
                  {item.sku && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">SKU:</span>
                      <span className="text-dark-50 font-medium font-mono text-sm">{item.sku}</span>
                    </div>
                  )}
                  {item.oemNumber && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">OEM номер:</span>
                      <span className="text-dark-50 font-medium font-mono text-sm">{item.oemNumber}</span>
                    </div>
                  )}
                  {item.manufacturerPartNumber && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Part Number:</span>
                      <span className="text-dark-50 font-medium font-mono text-sm">{item.manufacturerPartNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card variant="glass">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-dark-50">Складской учет</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">Остаток:</span>
                    <span
                      className={`text-lg font-bold ${
                        stockStatus === "low" ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {item.stock} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Мин. остаток:</span>
                    <span className="text-dark-50 font-medium">
                      {item.minStock} {item.unit}
                    </span>
                  </div>
                  {item.location && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Место на складе:</span>
                      <span className="text-dark-50 font-medium">{item.location}</span>
                    </div>
                  )}
                  {item.weight && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Вес:</span>
                      <span className="text-dark-50 font-medium">{item.weight} кг</span>
                    </div>
                  )}
                  {stockStatus === "low" && (
                    <div className="mt-4 p-3 rounded-xl bg-red-900/20 border border-red-700/50">
                      <p className="text-sm text-red-300">⚠ Низкий остаток на складе! Необходимо пополнение.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Цены */}
          {(item.price || item.cost) && (
            <Card variant="glass">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-dark-50">Ценообразование</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {item.price && (
                    <div className="p-4 rounded-xl bg-dark-800/70 border border-dark-700">
                      <div className="text-xs text-dark-400 mb-1">Цена продажи</div>
                      <div className="text-2xl font-bold text-emerald-400">{item.price} ₽</div>
                    </div>
                  )}
                  {item.cost && (
                    <div className="p-4 rounded-xl bg-dark-800/70 border border-dark-700">
                      <div className="text-xs text-dark-400 mb-1">Себестоимость</div>
                      <div className="text-2xl font-bold text-blue-400">{item.cost} ₽</div>
                    </div>
                  )}
                  {item.price && item.cost && (
                    <div className="p-4 rounded-xl bg-dark-800/70 border border-dark-700">
                      <div className="text-xs text-dark-400 mb-1">Маржа</div>
                      <div className="text-2xl font-bold text-accent-400">
                        {((((item.price as any) - (item.cost as any)) / (item.cost as any)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Совместимость */}
          {!item.isUniversal && (
            <Card variant="glass">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-dark-50">Совместимость с автомобилями</h4>
                  <Button size="sm" variant="outline" onClick={() => setShowCompatibility(!showCompatibility)}>
                    {showCompatibility ? "Скрыть" : "Управлять"}
                  </Button>
                </div>
                {item.compatibility && item.compatibility.length > 0 ? (
                  <div className="space-y-2">
                    {item.compatibility.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-3 rounded-xl bg-dark-800/70 border border-dark-700 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-dark-50">
                            {comp.vehicleBrand && (
                              <>
                                <span className="font-medium">{comp.vehicleBrand.name}</span>
                                {comp.vehicleModel && (
                                  <>
                                    <span className="text-dark-500">→</span>
                                    <span className="font-medium">{comp.vehicleModel.name}</span>
                                  </>
                                )}
                                {comp.vehicleGeneration && (
                                  <>
                                    <span className="text-dark-500">→</span>
                                    <span className="font-medium">{comp.vehicleGeneration.name}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          {(comp.yearFrom || comp.yearTo) && (
                            <div className="text-xs text-dark-400 mt-1">
                              Годы: {comp.yearFrom || "..."} — {comp.yearTo || "..."}
                            </div>
                          )}
                          {comp.notes && <div className="text-xs text-dark-400 mt-1">💡 {comp.notes}</div>}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCompatibilityMutation.mutate(comp.id)}
                          className="text-red-400 hover:bg-red-900/20"
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-dark-400 py-6">
                    <div className="text-3xl mb-2">🚗</div>
                    <p>Совместимость не настроена</p>
                    <p className="text-sm mt-1">Добавьте модели автомобилей, с которыми совместимо это комплектующее</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Аналоги и замены */}
          {item.crossReferences && item.crossReferences.length > 0 && (
            <Card variant="glass">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-dark-50">Аналоги и замены</h4>
                <div className="space-y-2">
                  {item.crossReferences.map((ref) => (
                    <div
                      key={ref.id}
                      className="p-3 rounded-xl bg-dark-800/70 border border-dark-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-dark-50 font-medium">{ref.toItem?.name}</div>
                        <div className="text-xs text-dark-400 mt-1">
                          {ref.referenceType === "replacement" && "🔄 Замена"}
                          {ref.referenceType === "analog" && "🔗 Аналог"}
                          {ref.referenceType === "upgrade" && "⬆️ Апгрейд"}
                          {ref.referenceType === "downgrade" && "⬇️ Даунгрейд"}
                          {ref.notes && ` • ${ref.notes}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Примечания */}
          {item.notes && (
            <Card variant="glass">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-dark-400">Примечания</h4>
                <p className="text-dark-300 whitespace-pre-wrap">{item.notes}</p>
              </div>
            </Card>
          )}

          {/* Действия */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-dark-700">
            <Button variant="ghost" onClick={() => onDelete(item.id)} className="text-red-400 hover:bg-red-900/20">
              🗑️ Удалить комплектующее
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Закрыть
              </Button>
              <Button variant="gradient" onClick={onEdit}>
                ✏️ Редактировать
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно управления совместимостью */}
      {showCompatibility && <CompatibilityManager itemId={itemId} onClose={() => setShowCompatibility(false)} />}
    </div>,
    document.body
  );
};
