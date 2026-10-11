// src/services/memberships.service.ts
import { apiClient } from '../api/apiClient';

// DTO de entrada (para POST)
export interface MembershipDto {
  associationId: number;
  memberId: number;
}

// DTO de salida (para GET) 
export interface MembershipOutDto {
  id: number;
  associationId: number;
  associationName: string;
  memberId: number;
  memberFullName: string;
  nationalId: string;
  historicalRank: string;
  weaponLicense: string;
  email: string; 
  startDate: string;
  endDate?: string | null;
}

export const membershipsService = {
  // Envía la solicitud para que un recreador se una a un regimiento
  enroll: (data: MembershipDto) => 
    apiClient<MembershipOutDto>('/memberships', { method: 'POST', data }),

  // Pide al backend la lista de regimientos a los que pertenece el usuario actual
  getMyMemberships: () => 
    apiClient<MembershipOutDto[]>('/members/me/memberships'),
  //Obtener la lista de tropas de un regimiento concreto
  getByAssociation: (associationId: number) => 
    apiClient<MembershipOutDto[]>(`/associations/${associationId}/memberships`),

  // Ejecutar la baja lógica (poner endDate a la fecha de hoy)
  licenciar: (membershipId: number) => 
    apiClient<void>(`/memberships/${membershipId}`, { method: 'DELETE' }),
};