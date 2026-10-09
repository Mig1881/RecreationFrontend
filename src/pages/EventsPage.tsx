// src/pages/EventsPage.tsx
import { useState, useEffect } from 'react';
import { eventsService, type HistoricEvent, type PublicEvent, type PrivateEvent } from '../services/events.service';
import { Calendar, MapPin, Building, LockOpen, Lock } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<HistoricEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventsService.getAll();
        setEvents(data);
      } catch (error: any) {
        setApiError(error.message || 'Error al cargar el calendario de campañas.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Cabecera */}
      <div>
        <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">
          Campañas y Eventos
        </h1>
        <p className="text-stone-500 mt-2">Calendario oficial de recreaciones históricas.</p>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-700 rounded shadow-sm">
          {apiError}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-stone-500 font-medium">
          Desplegando mapas tácticos...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          No hay campañas programadas en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Etiqueta Superior (Público/Privado) */}
              <div className={`px-4 py-2 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-white ${
                event.eventType === 'PUBLIC' ? 'bg-amber-800' : 'bg-stone-700'
              }`}>
                <span className="flex items-center gap-1">
                  {event.eventType === 'PUBLIC' ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {event.eventType === 'PUBLIC' ? 'Evento Público' : 'Maniobras Privadas'}
                </span>
                <span>{event.eventCode}</span>
              </div>

              {/* Cuerpo de la Tarjeta */}
              <div className="p-5 flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-1">
                    {event.city}, {event.country}
                  </h3>
                  <p className="text-sm text-stone-500 flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Org: {event.organizingAssociation?.name || 'Comandancia General'}
                  </p>
                </div>

                <div className="bg-stone-50 p-3 rounded border border-stone-100 flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-800 mt-0.5" />
                  <div className="text-sm text-stone-700">
                    <p><span className="font-bold">Inicio:</span> {new Date(event.startDate).toLocaleDateString()}</p>
                    <p><span className="font-bold">Fin:</span> {new Date(event.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Detalles Polimórficos */}
                <div className="text-sm border-t border-stone-200 pt-3">
                  {event.eventType === 'PUBLIC' ? (
                    <p className="text-stone-600">
                      <span className="font-bold text-stone-800">Entidad:</span> {(event as PublicEvent).publicEntity}
                    </p>
                  ) : (
                    <p className="text-stone-600">
                      <span className="font-bold text-stone-800">Patrocinador:</span> {(event as PrivateEvent).sponsor}
                    </p>
                  )}
                </div>
              </div>

              {/* Botón de Acción */}
              <div className="p-4 border-t border-stone-100 bg-stone-50">
                <button className="w-full py-2 px-4 border border-amber-800 rounded text-amber-900 font-bold hover:bg-amber-800 hover:text-white transition-colors">
                  Ver Plan de Operaciones
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}