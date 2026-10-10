// src/services/attendances.service.ts
import { apiClient } from '../api/apiClient';

export interface EventAttendanceDto {
  id?: number;
  eventId: number;
  eventCode?: string;
  associationId: number;
  associationName?: string;
}

export const attendancesService = {
  // Inscribe una asociación en un evento
  enroll: (data: EventAttendanceDto) => 
    apiClient<EventAttendanceDto>('/attendances', { method: 'POST', data }),
    
  // Obtiene las asociaciones apuntadas a un evento
  getByEvent: (eventId: number) => 
    apiClient<EventAttendanceDto[]>(`/attendances/event/${eventId}`),
    
  // Retira una asociación de un evento
  remove: (attendanceId: number) => 
    apiClient<void>(`/attendances/${attendanceId}`, { method: 'DELETE' }),
};