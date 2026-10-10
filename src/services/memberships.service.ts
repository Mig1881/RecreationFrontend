// src/services/memberships.service.ts
import { apiClient } from '../api/apiClient';

export interface MembershipDto {
  id?: number;
  associationId: number;
  associationName?: string;
  memberId: number;
  memberFullName?: string;
}

export const membershipsService = {
  // Envía la solicitud para que un recreador se una a un regimiento
  enroll: (data: MembershipDto) => 
    apiClient<MembershipDto>('/memberships', { method: 'POST', data }),
};