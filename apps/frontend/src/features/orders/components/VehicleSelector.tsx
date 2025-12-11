/**
 * Компонент для выбора автомобиля с каскадными выпадающими списками и поиском
 * Работает как на av.by - autocomplete с выпадающим списком
 * Структура: Марка -> Модель -> Поколение
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { vehiclesApi, type VehicleBrand, type VehicleModel, type VehicleGeneration } from "../../vehicles/api.js";

interface VehicleSelectorProps {
  onSelect: (generationId: string | null) => void;
  selectedGenerationId?: string;
}

export const VehicleSelector = ({ onSelect, selectedGenerationId }: VehicleSelectorProps) => {
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [generations, setGenerations] = useState<VehicleGeneration[]>([]);

  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedGenerationIdState, setSelectedGenerationIdState] = useState<string>(selectedGenerationId || "");

  const [brandInput, setBrandInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [generationInput, setGenerationInput] = useState("");

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showGenerationDropdown, setShowGenerationDropdown] = useState(false);

  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false);

  const brandRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef<HTMLDivElement>(null);

  // Загружаем все марки при монтировании
  useEffect(() => {
    const loadBrands = async () => {
      setIsLoadingBrands(true);
      try {
        const { brands: loadedBrands } = await vehiclesApi.getBrands();
        setBrands(loadedBrands);
      } catch (error) {
        console.error("Error loading brands:", error);
      } finally {
        setIsLoadingBrands(false);
      }
    };
    loadBrands();
  }, []);

  // Загружаем модели при выборе марки
  useEffect(() => {
    if (!selectedBrandId) {
      setModels([]);
      setGenerations([]);
      setSelectedModelId("");
      setSelectedGenerationIdState("");
      setModelInput("");
      setGenerationInput("");
      return;
    }

    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const { models: loadedModels } = await vehiclesApi.getModelsByBrand(selectedBrandId);
        setModels(loadedModels);
      } catch (error) {
        console.error("Error loading models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
  }, [selectedBrandId]);

  // Загружаем поколения при выборе модели
  useEffect(() => {
    if (!selectedModelId) {
      setGenerations([]);
      setSelectedGenerationIdState("");
      setGenerationInput("");
      return;
    }

    const loadGenerations = async () => {
      setIsLoadingGenerations(true);
      try {
        const { generations: loadedGenerations } = await vehiclesApi.getGenerationsByModel(selectedModelId);
        setGenerations(loadedGenerations);
      } catch (error) {
        console.error("Error loading generations:", error);
      } finally {
        setIsLoadingGenerations(false);
      }
    };
    loadGenerations();
  }, [selectedModelId]);

  // Уведомляем родителя об изменении выбранного поколения
  useEffect(() => {
    onSelect(selectedGenerationIdState || null);
  }, [selectedGenerationIdState, onSelect]);

  // Фильтруем марки по вводу (как на av.by - поиск по мере ввода)
  const filteredBrands = useMemo(() => {
    if (!brandInput) return brands.slice(0, 10); // Показываем первые 10 если нет поиска
    const searchLower = brandInput.toLowerCase();
    return brands
      .filter(
        (b) => b.name.toLowerCase().includes(searchLower) || (b.nameRu && b.nameRu.toLowerCase().includes(searchLower)),
      )
      .slice(0, 20); // Ограничиваем результаты поиска
  }, [brands, brandInput]);

  // Фильтруем модели по вводу
  const filteredModels = useMemo(() => {
    if (!modelInput) return models.slice(0, 10);
    const searchLower = modelInput.toLowerCase();
    return models
      .filter(
        (m) => m.name.toLowerCase().includes(searchLower) || (m.nameRu && m.nameRu.toLowerCase().includes(searchLower)),
      )
      .slice(0, 20);
  }, [models, modelInput]);

  // Фильтруем поколения по вводу
  const filteredGenerations = useMemo(() => {
    if (!generationInput) return generations;
    const searchLower = generationInput.toLowerCase();
    return generations.filter(
      (g) => g.name.toLowerCase().includes(searchLower) || (g.nameRu && g.nameRu.toLowerCase().includes(searchLower)),
    );
  }, [generations, generationInput]);

  // Закрытие выпадающих списков при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
      if (generationRef.current && !generationRef.current.contains(event.target as Node)) {
        setShowGenerationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBrandSelect = (brand: VehicleBrand) => {
    setSelectedBrandId(brand.id);
    setBrandInput(brand.nameRu || brand.name);
    setShowBrandDropdown(false);
    setModelInput("");
    setGenerationInput("");
  };

  const handleModelSelect = (model: VehicleModel) => {
    setSelectedModelId(model.id);
    setModelInput(model.nameRu || model.name);
    setShowModelDropdown(false);
    setGenerationInput("");
  };

  const handleGenerationSelect = (generation: VehicleGeneration) => {
    setSelectedGenerationIdState(generation.id);
    setGenerationInput(generation.nameRu || generation.name);
    setShowGenerationDropdown(false);
  };

  const clearBrand = () => {
    setSelectedBrandId("");
    setBrandInput("");
    setModels([]);
    setGenerations([]);
    setSelectedModelId("");
    setSelectedGenerationIdState("");
    setModelInput("");
    setGenerationInput("");
    setShowBrandDropdown(false);
  };

  const clearModel = () => {
    setSelectedModelId("");
    setModelInput("");
    setGenerations([]);
    setSelectedGenerationIdState("");
    setGenerationInput("");
    setShowModelDropdown(false);
  };

  const clearGeneration = () => {
    setSelectedGenerationIdState("");
    setGenerationInput("");
    setShowGenerationDropdown(false);
  };

  return (
    <div className="space-y-4">
      {/* Выбор марки */}
      <div ref={brandRef} className="relative">
        <label className="block text-sm font-medium text-dark-300 mb-2">Марка автомобиля</label>
        <div className="relative">
          <input
            type="text"
            value={brandInput}
            onChange={(e) => {
              setBrandInput(e.target.value);
              setShowBrandDropdown(true);
              if (!e.target.value) {
                clearBrand();
              }
            }}
            onFocus={() => {
              if (brands.length > 0) {
                setShowBrandDropdown(true);
              }
            }}
            placeholder="Начните вводить марку (например: Au)"
            className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          {selectedBrandId && (
            <button
              type="button"
              onClick={clearBrand}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
              aria-label="Очистить"
            >
              ✕
            </button>
          )}
          {showBrandDropdown && (filteredBrands.length > 0 || isLoadingBrands) && (
            <div className="absolute z-30 w-full mt-1 bg-dark-800 border border-dark-700 rounded-xl shadow-xl max-h-60 overflow-auto">
              {isLoadingBrands ? (
                <div className="px-4 py-3 text-center text-dark-400">Загрузка...</div>
              ) : (
                filteredBrands.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => handleBrandSelect(brand)}
                    className={`w-full px-4 py-2 text-left text-dark-50 hover:bg-dark-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      selectedBrandId === brand.id ? "bg-dark-700" : ""
                    }`}
                  >
                    {brand.nameRu || brand.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Выбор модели */}
      {selectedBrandId && (
        <div ref={modelRef} className="relative">
          <label className="block text-sm font-medium text-dark-300 mb-2">Модель</label>
          <div className="relative">
            <input
              type="text"
              value={modelInput}
              onChange={(e) => {
                setModelInput(e.target.value);
                setShowModelDropdown(true);
                if (!e.target.value) {
                  clearModel();
                }
              }}
              onFocus={() => {
                if (models.length > 0) {
                  setShowModelDropdown(true);
                }
              }}
              placeholder="Начните вводить модель"
              disabled={!selectedBrandId || isLoadingModels}
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedModelId && (
              <button
                type="button"
                onClick={clearModel}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                aria-label="Очистить"
              >
                ✕
              </button>
            )}
            {showModelDropdown && (filteredModels.length > 0 || isLoadingModels) && (
              <div className="absolute z-30 w-full mt-1 bg-dark-800 border border-dark-700 rounded-xl shadow-xl max-h-60 overflow-auto">
                {isLoadingModels ? (
                  <div className="px-4 py-3 text-center text-dark-400">Загрузка...</div>
                ) : (
                  filteredModels.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleModelSelect(model)}
                      className={`w-full px-4 py-2 text-left text-dark-50 hover:bg-dark-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        selectedModelId === model.id ? "bg-dark-700" : ""
                      }`}
                    >
                      {model.nameRu || model.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Выбор поколения */}
      {selectedModelId && (
        <div ref={generationRef} className="relative">
          <label className="block text-sm font-medium text-dark-300 mb-2">Поколение</label>
          <div className="relative">
            <input
              type="text"
              value={generationInput}
              onChange={(e) => {
                setGenerationInput(e.target.value);
                setShowGenerationDropdown(true);
                if (!e.target.value) {
                  clearGeneration();
                }
              }}
              onFocus={() => {
                if (generations.length > 0) {
                  setShowGenerationDropdown(true);
                }
              }}
              placeholder="Начните вводить поколение"
              disabled={!selectedModelId || isLoadingGenerations}
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedGenerationIdState && (
              <button
                type="button"
                onClick={clearGeneration}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                aria-label="Очистить"
              >
                ✕
              </button>
            )}
            {showGenerationDropdown && (filteredGenerations.length > 0 || isLoadingGenerations) && (
              <div className="absolute z-30 w-full mt-1 bg-dark-800 border border-dark-700 rounded-xl shadow-xl max-h-60 overflow-auto">
                {isLoadingGenerations ? (
                  <div className="px-4 py-3 text-center text-dark-400">Загрузка...</div>
                ) : (
                  filteredGenerations.map((generation) => (
                    <button
                      key={generation.id}
                      type="button"
                      onClick={() => handleGenerationSelect(generation)}
                      className={`w-full px-4 py-2 text-left text-dark-50 hover:bg-dark-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        selectedGenerationIdState === generation.id ? "bg-dark-700" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{generation.nameRu || generation.name}</span>
                        {generation.yearFrom && (
                          <span className="text-xs text-dark-400">
                            {generation.yearFrom}
                            {generation.yearTo ? `-${generation.yearTo}` : "+"}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
