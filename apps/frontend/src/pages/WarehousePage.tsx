import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { warehouseApi, type InventoryItem, type CreateInventoryItemInput } from "../features/warehouse/api.ts";
import { Button } from "../shared/ui/Button.tsx";
import { Card } from "../shared/ui/Card.tsx";
import { InventoryItemForm } from "../features/warehouse/components/InventoryItemForm.tsx";
import { InventoryItemDetails } from "../features/warehouse/components/InventoryItemDetails.tsx";

type Filter = {
  category: string;
  manufacturer: string;
  search: string;
  isUniversal?: boolean;
  isActive?: boolean;
};

export const WarehousePage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>({
    category: "",
    manufacturer: "",
    search: "",
    isUniversal: undefined,
    isActive: true,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["warehouse", "inventory", filter],
    queryFn: () => warehouseApi.getInventoryItems({
      category: filter.category || undefined,
      manufacturer: filter.manufacturer || undefined,
      search: filter.search || undefined,
      isUniversal: filter.isUniversal,
      isActive: filter.isActive,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateInventoryItemInput) => warehouseApi.createInventoryItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "inventory"] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInventoryItemInput> }) =>
      warehouseApi.updateInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "inventory"] });
      setIsFormOpen(false);
      setSelectedItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehouseApi.deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "inventory"] });
      setIsDetailsOpen(false);
      setSelectedItem(null);
    },
  });

  const items = inventoryData?.items ?? [];

  // Получаем уникальные категории и производителей для фильтров
  const categories = Array.from(new Set(items.map((item) => item.category))).sort();
  const manufacturers = Array.from(new Set(items.map((item) => item.manufacturer).filter(Boolean))).sort() as string[];

  const handleCreateItem = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить это комплектующее?")) {
      deleteMutation.mutate(id);
    }
  };

  const lowStockItems = items.filter((item) => item.stock <= item.minStock);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📦</span>
            <h1 className="text-4xl font-black text-gradient">Управление складом</h1>
          </div>
          <p className="text-dark-300 text-lg">Каталог комплектующих и управление совместимостью</p>
        </div>
        <Button variant="gradient" onClick={handleCreateItem}>
          + Добавить комплектующее
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card variant="glass" className="bg-gradient-to-br from-primary-900/20 to-primary-800/20 border-primary-700/30">
          <div className="space-y-2">
            <div className="text-sm font-medium text-dark-300">Всего позиций</div>
            <div className="text-3xl font-black text-primary-400">{items.length}</div>
          </div>
        </Card>
        <Card variant="glass" className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30">
          <div className="space-y-2">
            <div className="text-sm font-medium text-dark-300">Универсальные</div>
            <div className="text-3xl font-black text-blue-400">
              {items.filter((item) => item.isUniversal).length}
            </div>
          </div>
        </Card>
        <Card variant="glass" className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 border-emerald-700/30">
          <div className="space-y-2">
            <div className="text-sm font-medium text-dark-300">Активные</div>
            <div className="text-3xl font-black text-emerald-400">
              {items.filter((item) => item.isActive).length}
            </div>
          </div>
        </Card>
        <Card
          variant="glass"
          className={clsx(
            "bg-gradient-to-br border-accent-700/30",
            lowStockItems.length > 0
              ? "from-red-900/20 to-red-800/20"
              : "from-accent-900/20 to-accent-800/20"
          )}
        >
          <div className="space-y-2">
            <div className="text-sm font-medium text-dark-300">Низкий остаток</div>
            <div
              className={clsx(
                "text-3xl font-black",
                lowStockItems.length > 0 ? "text-red-400" : "text-accent-400"
              )}
            >
              {lowStockItems.length}
            </div>
          </div>
        </Card>
      </div>

      {/* Фильтры */}
      <Card variant="glass">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-dark-50">Фильтры</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-dark-400">Поиск</label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Название, артикул, OEM..."
                className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-dark-400">Категория</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
              >
                <option value="">Все категории</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-dark-400">Производитель</label>
              <select
                value={filter.manufacturer}
                onChange={(e) => setFilter((prev) => ({ ...prev, manufacturer: e.target.value }))}
                className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
              >
                <option value="">Все производители</option>
                {manufacturers.map((man) => (
                  <option key={man} value={man}>
                    {man}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-dark-400">Тип</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter((prev) => ({ ...prev, isUniversal: undefined }))}
                  className={clsx(
                    "flex-1 px-3 py-2 rounded-xl text-sm transition-all",
                    filter.isUniversal === undefined
                      ? "bg-primary-600 text-white"
                      : "bg-dark-900 border border-dark-700 text-dark-400"
                  )}
                >
                  Все
                </button>
                <button
                  onClick={() => setFilter((prev) => ({ ...prev, isUniversal: true }))}
                  className={clsx(
                    "flex-1 px-3 py-2 rounded-xl text-sm transition-all",
                    filter.isUniversal === true
                      ? "bg-primary-600 text-white"
                      : "bg-dark-900 border border-dark-700 text-dark-400"
                  )}
                >
                  Универс.
                </button>
                <button
                  onClick={() => setFilter((prev) => ({ ...prev, isUniversal: false }))}
                  className={clsx(
                    "flex-1 px-3 py-2 rounded-xl text-sm transition-all",
                    filter.isUniversal === false
                      ? "bg-primary-600 text-white"
                      : "bg-dark-900 border border-dark-700 text-dark-400"
                  )}
                >
                  Специфич.
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Таблица комплектующих */}
      <Card variant="glass">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-50">Комплектующие</h2>
            <span className="text-sm text-dark-400">{items.length} позиций</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left text-xs text-dark-400 pb-3 px-2">Название</th>
                    <th className="text-left text-xs text-dark-400 pb-3 px-2">Артикул/OEM</th>
                    <th className="text-left text-xs text-dark-400 pb-3 px-2">Производитель</th>
                    <th className="text-left text-xs text-dark-400 pb-3 px-2">Категория</th>
                    <th className="text-center text-xs text-dark-400 pb-3 px-2">Остаток</th>
                    <th className="text-center text-xs text-dark-400 pb-3 px-2">Цена</th>
                    <th className="text-center text-xs text-dark-400 pb-3 px-2">Тип</th>
                    <th className="text-right text-xs text-dark-400 pb-3 px-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={clsx(
                        "border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors",
                        item.stock <= item.minStock && "bg-red-900/10"
                      )}
                    >
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-dark-50 font-medium hover:text-primary-400 transition-colors text-left"
                        >
                          {item.name}
                        </button>
                        {item.description && (
                          <p className="text-xs text-dark-400 mt-1 line-clamp-1">{item.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm text-dark-300">
                          {item.sku && <div>SKU: {item.sku}</div>}
                          {item.oemNumber && <div className="text-xs text-dark-400">OEM: {item.oemNumber}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-dark-300">{item.manufacturer || "—"}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-dark-300">{item.category}</span>
                        {item.subcategory && (
                          <div className="text-xs text-dark-400">{item.subcategory}</div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={clsx(
                            "text-sm font-medium",
                            item.stock <= item.minStock ? "text-red-400" : "text-emerald-400"
                          )}
                        >
                          {item.stock} {item.unit}
                        </span>
                        {item.stock <= item.minStock && (
                          <div className="text-xs text-red-400 mt-1">⚠ Низкий</div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-sm text-dark-300">
                          {item.price ? `${item.price} ₽` : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {item.isUniversal ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-900/30 border border-blue-700/50 text-xs text-blue-400">
                            🌐 Универс.
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-900/30 border border-purple-700/50 text-xs text-purple-400">
                            🎯 Специфич.
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditItem(item)}>
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:bg-red-900/20"
                          >
                            🗑️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-dark-400 py-12">
              <div className="text-4xl mb-4">📭</div>
              <p>Нет комплектующих по выбранным фильтрам</p>
            </div>
          )}
        </div>
      </Card>

      {/* Модальное окно формы создания/редактирования */}
      {isFormOpen && (
        <InventoryItemForm
          item={selectedItem}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedItem(null);
          }}
          onSubmit={(data) => {
            if (selectedItem) {
              updateMutation.mutate({ id: selectedItem.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Модальное окно деталей */}
      {isDetailsOpen && selectedItem && (
        <InventoryItemDetails
          itemId={selectedItem.id}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedItem(null);
          }}
          onEdit={() => {
            setIsDetailsOpen(false);
            handleEditItem(selectedItem);
          }}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
};
