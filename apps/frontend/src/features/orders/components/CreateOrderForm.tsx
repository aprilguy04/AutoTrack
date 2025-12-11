/**
 * Форма создания заказа
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi, type CreateOrderData } from "../api.js";
import { useInvalidateOrders } from "../useOrders.js";
import { VehicleSelector } from "./VehicleSelector.js";
import { Button } from "../../../shared/ui/Button.js";
import { Card } from "../../../shared/ui/Card.js";

const SERVICE_TYPES = [
  { value: "diagnostics", label: "Диагностика" },
  { value: "repair", label: "Ремонт" },
  { value: "maintenance", label: "Техническое обслуживание" },
  { value: "other", label: "Другая проблема" },
] as const;

export const CreateOrderForm = () => {
  const navigate = useNavigate();
  const invalidateOrders = useInvalidateOrders();
  const [formData, setFormData] = useState<CreateOrderData>({
    serviceType: "diagnostics",
  });
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
  const [vehicleYear, setVehicleYear] = useState<string>("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Валидация
    if (!selectedGenerationId && !vehicleInfo) {
      setError("Выберите автомобиль или укажите информацию об автомобиле");
      return;
    }

    if (formData.serviceType === "other" && !formData.serviceTypeOther) {
      setError("Укажите тип работы");
      return;
    }

    setIsLoading(true);

    try {
      const orderData: CreateOrderData = {
        ...formData,
        vehicleGenerationId: selectedGenerationId || undefined,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
        vehicleInfo: vehicleInfo || undefined,
        description: description || undefined,
      };

      console.log("Creating order with data:", orderData);
      const { order } = await ordersApi.create(orderData);
      console.log("Order created successfully:", order.id);
      
      // Инвалидируем кеш заказов, чтобы обновить список
      invalidateOrders();
      
      // Возвращаемся на dashboard, чтобы увидеть новый заказ
      navigate("/client");
    } catch (err: any) {
      console.error("Error creating order:", err);
      console.error("Error response:", err.response?.data);
      
      let errorMessage = "Ошибка при создании заказа";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Если есть ошибки валидации, показываем первую
        const firstError = err.response.data.errors[0];
        errorMessage = firstError?.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="glass" className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gradient mb-2">Создать заказ</h2>
          <p className="text-dark-300">Заполните информацию об автомобиле и типе работ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Выбор автомобиля */}
          <div>
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Автомобиль</h3>
            <VehicleSelector onSelect={setSelectedGenerationId} selectedGenerationId={selectedGenerationId || undefined} />

            {/* Год выпуска */}
            {selectedGenerationId && (
              <div className="mt-4">
                <label htmlFor="vehicleYear" className="block text-sm font-medium text-dark-300 mb-2">
                  Год выпуска (необязательно)
                </label>
                <input
                  id="vehicleYear"
                  type="number"
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="2020"
                />
              </div>
            )}

            {/* Дополнительная информация об автомобиле */}
            <div className="mt-4">
              <label htmlFor="vehicleInfo" className="block text-sm font-medium text-dark-300 mb-2">
                Дополнительная информация (VIN, номер и т.д.)
              </label>
              <input
                id="vehicleInfo"
                type="text"
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="VIN, номер кузова и т.д."
              />
            </div>
          </div>

          {/* Тип работы */}
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-dark-300 mb-2">
              Тип работы
            </label>
            <select
              id="serviceType"
              value={formData.serviceType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  serviceType: e.target.value as CreateOrderData["serviceType"],
                  serviceTypeOther: undefined,
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Если выбран "Другая проблема" */}
            {formData.serviceType === "other" && (
              <div className="mt-4">
                <label htmlFor="serviceTypeOther" className="block text-sm font-medium text-dark-300 mb-2">
                  Опишите проблему
                </label>
                <input
                  id="serviceTypeOther"
                  type="text"
                  value={formData.serviceTypeOther || ""}
                  onChange={(e) => setFormData({ ...formData, serviceTypeOther: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Опишите тип работ"
                />
              </div>
            )}
          </div>

          {/* Комментарий */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark-300 mb-2">
              Комментарий к заказу
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Опишите проблему или что нужно сделать..."
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/client")}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" variant="gradient" className="flex-1" isLoading={isLoading}>
              Создать заказ
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

