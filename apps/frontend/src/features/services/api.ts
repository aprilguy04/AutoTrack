/**
 * API функции для работы с услугами (каталог)
 */
import { api } from "../../shared/api/client.js";

export interface StageTemplate {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  stageTemplates: StageTemplate[];
}

export const servicesApi = {
  /**
   * Получить все шаблоны услуг
   */
  getAll: async (): Promise<{ services: ServiceTemplate[] }> => {
    const response = await api.get<{ services: ServiceTemplate[] }>("/catalog/services");
    return response.data;
  },

  /**
   * Получить шаблон услуги по ID
   */
  getById: async (id: string): Promise<{ service: ServiceTemplate }> => {
    const response = await api.get<{ service: ServiceTemplate }>(`/catalog/services/${id}`);
    return response.data;
  },
};
