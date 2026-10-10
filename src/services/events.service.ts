// src/services/events.service.ts
import { apiClient } from '../api/apiClient';

export interface AssociationRef {
  name: string;
}

// Interfaz Base común para todos los eventos
export interface BaseEvent {
  id?: number;
  eventType: 'PUBLIC' | 'PRIVATE';
  eventCode: string;
  // Opcional para lectura (GET)
  organizingAssociation?: AssociationRef; 
  // ID para escritura (POST/PUT)
  organizingAssociationId?: number; 
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  cost?: number;
  published: boolean;
}

// Extensión para Eventos Públicos
export interface PublicEvent extends BaseEvent {
  eventType: 'PUBLIC';
  publicEntity: string;
  subsidy: number;
}

// Extensión para Eventos Privados
export interface PrivateEvent extends BaseEvent {
  eventType: 'PRIVATE';
  sponsor: string;
  openToPublic?: boolean;
  initialBudget?: number;
}

// Tipo de Unión que agrupa ambos
export type HistoricEvent = PublicEvent | PrivateEvent;

export const eventsService = {
  // Obtiene todos los eventos
  getAll: () => apiClient<HistoricEvent[]>('/events'),
  // Método para traer un evento por su ID
  getById: (id: number) => apiClient<HistoricEvent>(`/events/${id}`),
  
  // CRUD completo para eventos, usando HistoricEvent como base
  // Usamos un Omit porque al crear no enviamos el ID y usamos HistoricEvent como base
  create: (data: any) => apiClient<HistoricEvent>('/events', { method: 'POST', data }),
  update: (id: number, data: any) => apiClient<HistoricEvent>(`/events/${id}`, { method: 'PUT', data }),
  delete: (id: number) => apiClient<void>(`/events/${id}`, { method: 'DELETE' }),
};