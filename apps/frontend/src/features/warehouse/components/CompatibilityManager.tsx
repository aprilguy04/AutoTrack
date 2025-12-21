import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseApi, type AddCompatibilityInput } from "../api.ts";
import { vehiclesApi } from "../../vehicles/api.ts";
import { Button } from "../../../shared/ui/Button.tsx";
import { Card } from "../../../shared/ui/Card.tsx";

interface CompatibilityManagerProps {
  itemId: string;
  onClose: () => void;
}

export const CompatibilityManager = ({ itemId, onClose }: CompatibilityManagerProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Omit<AddCompatibilityInput, "inventoryItemId">>({
    vehicleBrandId: undefined,
    vehicleModelId: undefined,
    vehicleGenerationId: undefined,
    yearFrom: undefined,
    yearTo: undefined,
    notes: "",
  });

  const { data: brandsData } = useQuery({
    queryKey: ["vehicles", "brands"],
    queryFn: () => vehiclesApi.getBrands(),
  });

  const { data: modelsData } = useQuery({
    queryKey: ["vehicles", "models", formData.vehicleBrandId],
    queryFn: () => vehiclesApi.getModelsByBrand(formData.vehicleBrandId!),
    enabled: !!formData.vehicleBrandId,
  });

  const { data: generationsData } = useQuery({
    queryKey: ["vehicles", "generations", formData.vehicleModelId],
    queryFn: () => vehiclesApi.getGenerationsByModel(formData.vehicleModelId!),
    enabled: !!formData.vehicleModelId,
  });

  const addCompatibilityMutation = useMutation({
    mutationFn: (data: AddCompatibilityInput) => warehouseApi.addCompatibility(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "item", itemId] });
      setFormData({
        vehicleBrandId: undefined,
        vehicleModelId: undefined,
        vehicleGenerationId: undefined,
        yearFrom: undefined,
        yearTo: undefined,
        notes: "",
      });
    },
  });

  const brands = brandsData?.brands ?? [];
  const models = modelsData?.models ?? [];
  const generations = generationsData?.generations ?? [];

  const handleBrandChange = (brandId: string) => {
    setFormData({
      vehicleBrandId: brandId || undefined,
      vehicleModelId: undefined,
      vehicleGenerationId: undefined,
      yearFrom: undefined,
      yearTo: undefined,
      notes: formData.notes,
    });
  };

  const handleModelChange = (modelId: string) => {
    setFormData({
      ...formData,
      vehicleModelId: modelId || undefined,
      vehicleGenerationId: undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleBrandId && !formData.vehicleModelId && !formData.vehicleGenerationId) {
      alert("Выберите хотя бы марку, модель или поколение автомобиля");
      return;
    }

    addCompatibilityMutation.mutate({
      inventoryItemId: itemId,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <Card variant="glass" className="w-full max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-dark-50">Добавить совместимость</h3>
              <p className="text-sm text-dark-400 mt-1">Укажите, с какими автомобилями совместимо комплектующее</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-700/50">
            <p className="text-sm text-blue-300">
              💡 <strong>Каскадная совместимость:</strong>
            </p>
            <ul className="text-sm text-blue-300 mt-2 space-y-1 ml-4">
              <li>• Только марка → подходит для всех моделей марки</li>
              <li>• Марка + модель → подходит для всех поколений модели</li>
              <li>• Марка + модель + поколение → подходит для конкретного поколения</li>
              <li>• Годы (необязательно) → дополнительное уточнение по годам выпуска</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Марка */}
            <div className="space-y-2">
              <label className="text-xs text-dark-400">
                Марка <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.vehicleBrandId || ""}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                required
              >
                <option value="">Выберите марку...</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} {brand.nameRu && `(${brand.nameRu})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Модель */}
            {formData.vehicleBrandId && (
              <div className="space-y-2">
                <label className="text-xs text-dark-400">
                  Модель <span className="text-dark-500">(необязательно)</span>
                </label>
                <select
                  value={formData.vehicleModelId || ""}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                >
                  <option value="">Все модели марки</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.nameRu && `(${model.nameRu})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Поколение */}
            {formData.vehicleModelId && (
              <div className="space-y-2">
                <label className="text-xs text-dark-400">
                  Поколение <span className="text-dark-500">(необязательно)</span>
                </label>
                <select
                  value={formData.vehicleGenerationId || ""}
                  onChange={(e) => setFormData({ ...formData, vehicleGenerationId: e.target.value || undefined })}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                >
                  <option value="">Все поколения модели</option>
                  {generations.map((gen) => (
                    <option key={gen.id} value={gen.id}>
                      {gen.name} {gen.nameRu && `(${gen.nameRu})`}
                      {gen.yearFrom && gen.yearTo && ` (${gen.yearFrom}-${gen.yearTo})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Годы */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-dark-400">
                  Год с <span className="text-dark-500">(необязательно)</span>
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={formData.yearFrom || ""}
                  onChange={(e) => setFormData({ ...formData, yearFrom: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Например, 2015"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-dark-400">
                  Год по <span className="text-dark-500">(необязательно)</span>
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={formData.yearTo || ""}
                  onChange={(e) => setFormData({ ...formData, yearTo: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                  placeholder="Например, 2020"
                />
              </div>
            </div>

            {/* Примечания */}
            <div className="space-y-2">
              <label className="text-xs text-dark-400">Примечания</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-3 py-2"
                placeholder="Дополнительная информация о совместимости..."
              />
            </div>

            {/* Кнопки */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" variant="gradient" isLoading={addCompatibilityMutation.isPending}>
                Добавить совместимость
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
