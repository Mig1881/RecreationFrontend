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
  qrToken?: string;
}

export const participationsService = {
  enroll: (data: EventParticipationDto) => 
    apiClient<EventParticipationDto>('/participations', { method: 'POST', data }),
    
  getByEvent: (eventId: number) => 
    apiClient<EventParticipationDto[]>(`/participations/event/${eventId}`),
    
  getByMember: (memberId: number) => 
    apiClient<EventParticipationDto[]>(`/participations/member/${memberId}`),
    
  remove: (participationId: number) => 
    apiClient<void>(`/participations/${participationId}`, { method: 'DELETE' }),
};