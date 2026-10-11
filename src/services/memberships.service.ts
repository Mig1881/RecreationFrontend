// src/services/memberships.service.ts
import { apiClient } from '../api/apiClient';

// DTO que ya tenías para solicitar ingreso (POST)
export interface MembershipDto {
  id?: number;
  associationId: number;
  associationName?: string;
  memberId: number;
  memberFullName?: string;
}

//DTO de salida para leer tus membresías (GET /me/memberships)
export interface MembershipOutDto {
  id: number;
  associationId: number;
  associationName: string;
  role: string;
}

export const membershipsService = {
  //Envía la solicitud para que un recreador se una a un regimiento (Tu método original)
  enroll: (data: MembershipDto) => 
    apiClient<MembershipDto>('/memberships', { method: 'POST', data }),

  //Pide al backend la lista de regimientos a los que pertenece el usuario actual
  getMyMemberships: () => 
    apiClient<MembershipOutDto[]>('/members/me/memberships'),
};