// src/services/members.service.ts
import { apiClient } from '../api/apiClient';

// Definición de la interfaz Member según el modelo del backend
export interface Member {
  id: number;
  nationalId: string;
  lastName: string;
  firstName: string;
  phone?: string;
  associationPosition?: string;
  historicalRank?: string;
  weaponLicense?: string;
  birthDate?: string;
  enrollmentDate?: string;
  imageUrl?: string;
  email: string;
  role: string;
}

export const membersService = {
  // Obtiene la lista completa de recreadores
  getAll: () => apiClient<Member[]>('/members'),
  // Obtiene el expediente completo de un único recreador por su ID
  getById: (id: number) => apiClient<Member>(`/members/${id}`),

  // Modifica los detalles de un recreador existente (guardando la URL de la foto)
  update: (id: number, memberData: Member) => 
    apiClient<Member>(`/members/${id}`, { method: 'PUT', data: memberData }),
};