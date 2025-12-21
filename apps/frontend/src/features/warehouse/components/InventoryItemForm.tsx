import { useState, useEffect } from "react";
import type { InventoryItem, CreateInventoryItemInput } from "../api.ts";
import { Button } from "../../../shared/ui/Button.tsx";

interface InventoryItemFormProps {
  item?: InventoryItem | null;
  onClose: () => void;
  onSubmit: (data: CreateInventoryItemInput) => void;
  isLoading: boolean;
}

export const InventoryItemForm = ({ item, onClose, onSubmit, isLoading }: InventoryItemFormProps) => {
  const [formData, setFormData] = useState<CreateInventoryItemInput>({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    sku: "",
    oemNumber: "",
    manufacturerPartNumber: "",
    manufacturer: "",
    stock: 0,
    minStock: 0,
    unit: "шт",
    price: undefined,
    cost: undefined,
    isUniversal: false,
    weight: undefined,
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        category: item.category,
        subcategory: item.subcategory || "",
        sku: item.sku || "",
        oemNumber: item.oemNumber || "",
        manufacturerPartNumber: item.manufacturerPartNumber || "",
        manufacturer: item.manufacturer || "",
        stock: item.stock,
        minStock: item.minStock,
        unit: item.unit,
        price: item.price,
        cost: item.cost,
        isUniversal: item.isUniversal,
        weight: item.weight,
        location: item.location || "",
        notes: item.notes || "",
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateInventoryItemInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-dark-900 rounded-3xl border border-dark-700 shadow-2xl my-8">
        <div className="p-6 border-b border-dark-700 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-dark-50">
              {item ? "Редактировать комплектующее" : "Добавить комплектующее"}
            </h3>
            <p className="text-sm text-dark-400 mt-1">
              {item ? "Внесите изменения в данные комплектующего" : "Заполните информацию о новом комплектующем"}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-dark-50">Основная информация</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-dark-400">
                  Название <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Например, Тормозные колодки передние"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">
                  Категория <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Например, brakes"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-dark-400">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                placeholder="Подробное описание комплектующего..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Подкатегория</label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => handleChange("subcategory", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Например, передние"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Производитель</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange("manufacturer", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Например, Bosch"
                />
              </div>
            </div>
          </div>

          {/* Артикулы и номера */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-dark-50">Артикулы и номера</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-dark-400">SKU (артикул)</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Внутренний артикул"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">OEM номер</label>
                <input
                  type="text"
                  value={formData.oemNumber}
                  onChange={(e) => handleChange("oemNumber", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="OEM производителя"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Артикул производителя</label>
                <input
                  type="text"
                  value={formData.manufacturerPartNumber}
                  onChange={(e) => handleChange("manufacturerPartNumber", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Part number"
                />
              </div>
            </div>
          </div>

          {/* Складской учет */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-dark-50">Складской учет</h4>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Остаток</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleChange("stock", parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Мин. остаток</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => handleChange("minStock", parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Единица измерения</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="шт, л, кг..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Место на складе</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Стеллаж A-12"
                />
              </div>
            </div>
          </div>

          {/* Цены и вес */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-dark-50">Цены и характеристики</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Цена продажи (₽)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) => handleChange("price", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Себестоимость (₽)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost || ""}
                  onChange={(e) => handleChange("cost", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">Вес (кг)</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.weight || ""}
                  onChange={(e) => handleChange("weight", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Совместимость */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-dark-50">Совместимость с автомобилями</h4>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isUniversal"
                checked={formData.isUniversal}
                onChange={(e) => handleChange("isUniversal", e.target.checked)}
                className="w-5 h-5 rounded border-dark-600 bg-dark-900 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isUniversal" className="text-sm text-dark-300">
                Универсальное комплектующее (подходит для всех автомобилей)
              </label>
            </div>
            {!formData.isUniversal && (
              <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-700/50">
                <p className="text-sm text-blue-300">
                  💡 Совместимость с конкретными моделями автомобилей можно настроить после создания комплектующего в
                  разделе "Детали"
                </p>
              </div>
            )}
          </div>

          {/* Примечания */}
          <div className="space-y-2">
            <label className="text-xs text-dark-400">Примечания</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
              placeholder="Дополнительная информация для внутреннего использования..."
            />
          </div>

          {/* Кнопки */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="gradient" isLoading={isLoading}>
              {item ? "Сохранить изменения" : "Создать комплектующее"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
