import { api } from "../../shared/api/client.js";

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  oemNumber?: string;
  manufacturerPartNumber?: string;
  manufacturer?: string;
  stock: number;
  minStock: number;
  unit: string;
  price?: number;
  cost?: number;
  isUniversal: boolean;
  isActive: boolean;
  weight?: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  compatibility?: InventoryItemCompatibility[];
  crossReferences?: InventoryItemCrossReference[];
  referencedBy?: InventoryItemCrossReference[];
}

export interface InventoryItemCompatibility {
  id: string;
  inventoryItemId: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  vehicleGenerationId?: string;
  yearFrom?: number;
  yearTo?: number;
  notes?: string;
  createdAt: string;
  vehicleBrand?: {
    id: string;
    name: string;
    nameRu?: string;
  };
  vehicleModel?: {
    id: string;
    name: string;
    nameRu?: string;
  };
  vehicleGeneration?: {
    id: string;
    name: string;
    nameRu?: string;
  };
}

export interface InventoryItemCrossReference {
  id: string;
  fromItemId: string;
  toItemId: string;
  referenceType: "replacement" | "analog" | "upgrade" | "downgrade";
  notes?: string;
  createdAt: string;
  fromItem?: InventoryItem;
  toItem?: InventoryItem;
}

export interface CreateInventoryItemInput {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  oemNumber?: string;
  manufacturerPartNumber?: string;
  manufacturer?: string;
  stock?: number;
  minStock?: number;
  unit?: string;
  price?: number;
  cost?: number;
  isUniversal?: boolean;
  weight?: number;
  location?: string;
  notes?: string;
}

export interface UpdateInventoryItemInput extends Partial<CreateInventoryItemInput> {
  isActive?: boolean;
}

export interface AddCompatibilityInput {
  inventoryItemId: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  vehicleGenerationId?: string;
  yearFrom?: number;
  yearTo?: number;
  notes?: string;
}

export interface AddCrossReferenceInput {
  fromItemId: string;
  toItemId: string;
  referenceType: "replacement" | "analog" | "upgrade" | "downgrade";
  notes?: string;
}

export const warehouseApi = {
  // ============================================================================
  // CRUD КОМПЛЕКТУЮЩИХ
  // ============================================================================

  getInventoryItems: async (params?: {
    category?: string;
    isUniversal?: boolean;
    isActive?: boolean;
    manufacturer?: string;
    search?: string;
  }): Promise<{ items: InventoryItem[] }> => {
    const response = await api.get<{ items: InventoryItem[] }>(
      "/warehouse",
      { params }
    );
    return response.data;
  },

  getCompatibleInventoryItems: async (params: {
    vehicleBrandId?: string;
    vehicleModelId?: string;
    vehicleGenerationId?: string;
    vehicleYear?: number;
    category?: string;
  }): Promise<{ items: InventoryItem[] }> => {
    const response = await api.get<{ items: InventoryItem[] }>(
      "/warehouse/compatible",
      { params }
    );
    return response.data;
  },

  getInventoryItemById: async (id: string): Promise<{ item: InventoryItem }> => {
    const response = await api.get<{ item: InventoryItem }>(`/warehouse/${id}`);
    return response.data;
  },

  createInventoryItem: async (data: CreateInventoryItemInput): Promise<{ item: InventoryItem }> => {
    const response = await api.post<{ item: InventoryItem }>("/warehouse", data);
    return response.data;
  },

  updateInventoryItem: async (id: string, data: UpdateInventoryItemInput): Promise<{ item: InventoryItem }> => {
    const response = await api.patch<{ item: InventoryItem }>(`/warehouse/${id}`, data);
    return response.data;
  },

  deleteInventoryItem: async (id: string): Promise<void> => {
    await api.delete(`/warehouse/${id}`);
  },

  // ============================================================================
  // УПРАВЛЕНИЕ СОВМЕСТИМОСТЬЮ
  // ============================================================================

  addCompatibility: async (data: AddCompatibilityInput): Promise<{ compatibility: InventoryItemCompatibility }> => {
    const response = await api.post<{ compatibility: InventoryItemCompatibility }>(
      "/warehouse/compatibility",
      data
    );
    return response.data;
  },

  removeCompatibility: async (id: string): Promise<void> => {
    await api.delete(`/warehouse/compatibility/${id}`);
  },

  // ============================================================================
  // КРОСС-ССЫЛКИ (АНАЛОГИ/ЗАМЕНЫ)
  // ============================================================================

  addCrossReference: async (data: AddCrossReferenceInput): Promise<{ crossRef: InventoryItemCrossReference }> => {
    const response = await api.post<{ crossRef: InventoryItemCrossReference }>(
      "/warehouse/cross-reference",
      data
    );
    return response.data;
  },

  removeCrossReference: async (id: string): Promise<void> => {
    await api.delete(`/warehouse/cross-reference/${id}`);
  },
};
