// src/services/participations.service.ts
import { apiClient } from '../api/apiClient';

export interface EventParticipationDto {
  id?: number;
  eventId: number;
  eventCode?: string;
  memberId: number;
  memberFullName?: string;
  carriedWeapon: string;
  weaponModel: string;
}

export const participationsService = {
  enroll: (data: EventParticipationDto) => 
    apiClient<EventParticipationDto>('/participations', { method: 'POST', data }),
    
  getByEvent: (eventId: number) => 
    apiClient<EventParticipationDto[]>(`/participations/event/${eventId}`), // Ajusta esta ruta si en tu API es distinta
    
  remove: (participationId: number) => 
    apiClient<void>(`/participations/${participationId}`, { method: 'DELETE' }),
};