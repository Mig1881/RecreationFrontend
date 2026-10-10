// src/services/associations.service.ts
import { apiClient } from '../api/apiClient';

// Interfaz actualizada para coincidir al 100% con tu Base de Datos y DTOs
export interface Association {
  id?: number;
  taxId: string; 
  foundationYear: number;
  name: string;
  allegiance: string; 
  historicalAttire: string; 
  logoBase64?: string; 
}

export const associationsService = {
  getAll: () => apiClient<Association[]>('/associations'),
  getById: (id: number) => apiClient<Association>(`/associations/${id}`),
  create: (data: Association) => apiClient<Association>('/associations', { method: 'POST', data }),
  update: (id: number, data: Association) => apiClient<Association>(`/associations/${id}`, { method: 'PUT', data }),
  delete: (id: number) => apiClient<void>(`/associations/${id}`, { method: 'DELETE' }),
};