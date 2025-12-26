/**
 * Форма создания заказа
 */
import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi, type CreateOrderData } from "../api.js";
import { useInvalidateOrders } from "../useOrders.js";
import { VehicleSelector, type SelectedGenerationInfo } from "./VehicleSelector.js";
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
  const [generationYearRange, setGenerationYearRange] = useState<{ yearFrom?: number; yearTo?: number } | null>(null);
  const [vehicleYear, setVehicleYear] = useState<string>("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [yearError, setYearError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Храним предыдущий ID поколения чтобы сбрасывать год только при реальной смене
  const prevGenerationIdRef = useRef<string | null>(null);

  const handleGenerationSelect = useCallback((generationId: string | null, generationInfo?: SelectedGenerationInfo) => {
    // Сбрасываем год только если поколение реально изменилось
    const shouldResetYear = prevGenerationIdRef.current !== generationId;
    prevGenerationIdRef.current = generationId;

    setSelectedGenerationId(generationId);
    if (generationInfo) {
      setGenerationYearRange({ yearFrom: generationInfo.yearFrom, yearTo: generationInfo.yearTo });
    } else {
      setGenerationYearRange(null);
    }

    if (shouldResetYear) {
      setVehicleYear("");
      setYearError("");
    }
  }, []);

  const currentYear = new Date().getFullYear();

  const handleYearChange = (value: string) => {
    setVehicleYear(value);
    setYearError("");

    // Валидируем только когда введено 4 цифры (полный год)
    if (value && value.length === 4) {
      const year = parseInt(value);
      if (!isNaN(year)) {
        // Проверка минимального года (yearFrom поколения)
        if (generationYearRange?.yearFrom && year < generationYearRange.yearFrom) {
          setYearError(`Год не может быть меньше ${generationYearRange.yearFrom}`);
        }
        // Проверка максимального года (yearTo поколения или текущий год)
        else {
          const maxYear = generationYearRange?.yearTo || currentYear;
          if (year > maxYear) {
            setYearError(`Год не может быть больше ${maxYear}`);
          }
        }
      }
    }
  };

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

    // Валидация года при отправке
    if (vehicleYear) {
      const year = parseInt(vehicleYear);
      if (!isNaN(year)) {
        if (generationYearRange?.yearFrom && year < generationYearRange.yearFrom) {
          setError(`Год выпуска не может быть меньше ${generationYearRange.yearFrom}`);
          return;
        }
        const maxYear = generationYearRange?.yearTo || currentYear;
        if (year > maxYear) {
          setError(`Год выпуска не может быть больше ${maxYear}`);
          return;
        }
      }
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
            <VehicleSelector onSelect={handleGenerationSelect} selectedGenerationId={selectedGenerationId || undefined} />

            {/* Год выпуска */}
            {selectedGenerationId && (
              <div className="mt-4">
                <label htmlFor="vehicleYear" className="block text-sm font-medium text-dark-300 mb-2">
                  Год выпуска (необязательно)
                  {(generationYearRange?.yearFrom || generationYearRange?.yearTo) && (
                    <span className="ml-2 text-xs text-primary-400">
                      {generationYearRange.yearFrom}-{generationYearRange.yearTo || currentYear}
                    </span>
                  )}
                </label>
                <input
                  id="vehicleYear"
                  type="number"
                  value={vehicleYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  min={generationYearRange?.yearFrom || 1900}
                  max={generationYearRange?.yearTo || currentYear}
                  className={`w-full px-4 py-3 rounded-xl bg-dark-800 border text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    yearError ? "border-red-500" : "border-dark-700"
                  }`}
                  placeholder={`${generationYearRange?.yearFrom || 1900}-${generationYearRange?.yearTo || currentYear}`}
                />
                {yearError && (
                  <p className="mt-1 text-xs text-red-400">{yearError}</p>
                )}
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

