// src/services/events.service.ts
import { apiClient } from '../api/apiClient';

// Definición básica de Asociación para relacionarla con el evento
export interface AssociationRef {
  id: number;
  name: string;
}

// Interfaz Base común para todos los eventos
export interface BaseEvent {
  id: number;
  eventType: 'PUBLIC' | 'PRIVATE';
  eventCode: string;
  organizingAssociation: AssociationRef;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
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
  openToPublic: boolean;
}

// Tipo de Unión que agrupa ambos
export type HistoricEvent = PublicEvent | PrivateEvent;

export const eventsService = {
  // Obtiene todos los eventos
  getAll: () => apiClient<HistoricEvent[]>('/events'),
};