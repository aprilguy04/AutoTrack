/**
 * API функции для работы с автомобилями
 */
import { api } from "../../shared/api/client.js";

export interface VehicleBrand {
  id: string;
  name: string;
  nameRu?: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  nameRu?: string;
  brandId: string;
}

export interface VehicleGeneration {
  id: string;
  name: string;
  nameRu?: string;
  modelId: string;
  yearFrom?: number;
  yearTo?: number;
}

export const vehiclesApi = {
  /**
   * Получить все марки (с поиском)
   */
  getBrands: async (search?: string): Promise<{ brands: VehicleBrand[] }> => {
    const params = search ? { search } : {};
    const response = await api.get<{ brands: VehicleBrand[] }>("/vehicles/brands", { params });
    return response.data;
  },

  /**
   * Получить модели по марке (с поиском)
   */
  getModelsByBrand: async (brandId: string, search?: string): Promise<{ models: VehicleModel[] }> => {
    const params = search ? { search } : {};
    const response = await api.get<{ models: VehicleModel[] }>(`/vehicles/brands/${brandId}/models`, { params });
    return response.data;
  },

  /**
   * Получить поколения по модели (с поиском)
   */
  getGenerationsByModel: async (modelId: string, search?: string): Promise<{ generations: VehicleGeneration[] }> => {
    const params = search ? { search } : {};
    const response = await api.get<{ generations: VehicleGeneration[] }>(`/vehicles/models/${modelId}/generations`, { params });
    return response.data;
  },
};
