// src/pages/MyDeploymentsPage.tsx
import { useState, useEffect } from 'react';
import { participationsService, type EventParticipationDto } from '../services/participations.service';
import { eventsService, type HistoricEvent } from '../services/events.service';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, MapPin, Crosshair, Calendar, X, Clock, CheckCircle, Archive } from 'lucide-react';

export default function MyDeploymentsPage() {
  const { state } = useAuth();
  const { user } = state;
  const [participations, setParticipations] = useState<EventParticipationDto[]>([]);
  const [events, setEvents] = useState<HistoricEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedQR, setSelectedQR] = useState<EventParticipationDto | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [partsData, eventsData] = await Promise.all([
          participationsService.getByMember(user.id),
          eventsService.getAll()
        ]);
        setParticipations(partsData);
        setEvents(eventsData);
      } catch (error) {
        console.error("Error al cargar los pases de batalla");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  if (isLoading) return <div className="p-12 text-center text-stone-500">Imprimiendo pases de batalla...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">Mis Despliegues</h1>
        <p className="text-stone-500 mt-2">Tus pases de batalla oficiales y control de armamento.</p>
      </div>

      {participations.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
          <Ticket className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No tienes órdenes de despliegue activas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {participations.map((part) => {
            const eventDetails = events.find(e => e.id === part.eventId);
            
            let isPast = false;
            let dateText = "Fechas sin confirmar";

            if (eventDetails && eventDetails.endDate) {
              const endDate = new Date(eventDetails.endDate);
              const today = new Date();
              endDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              
              isPast = endDate < today;
              
              const startStr = new Date(eventDetails.startDate).toLocaleDateString();
              const endStr = new Date(eventDetails.endDate).toLocaleDateString();
              dateText = startStr === endStr ? startStr : `Del ${startStr} al ${endStr}`;
            }

            return (
              <div key={part.id} className={`bg-white rounded-xl shadow-md border overflow-hidden flex flex-col transition-all ${isPast ? 'border-stone-200 opacity-85' : 'border-amber-200'}`}>
                
                <div className={`px-4 py-3 flex justify-between items-center text-white ${isPast ? 'bg-stone-500' : 'bg-amber-900'}`}>
                  <span className="font-bold tracking-wider">{part.eventCode}</span>
                  <Ticket className="h-5 w-5 opacity-70" />
                </div>
                
                <div className="p-5 flex-1 space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className={`h-6 w-6 mt-1 shrink-0 ${isPast ? 'text-stone-400' : 'text-amber-800'}`} />
                    <div className="flex-1">
                      <p className="text-xl font-bold text-stone-900">
                        {eventDetails ? eventDetails.city : 'Ubicación desconocida'}
                      </p>
                      <p className="text-sm text-stone-600 mb-3">{dateText}</p>
                      
                      {isPast ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-stone-100 text-stone-500 border border-stone-200">
                          <CheckCircle className="h-3.5 w-3.5" /> Campaña Finalizada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                          <Clock className="h-3.5 w-3.5" /> Próximo Despliegue
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 flex items-start gap-3">
                    <Crosshair className={`h-5 w-5 mt-0.5 shrink-0 ${isPast ? 'text-stone-400' : 'text-amber-800'}`} />
                    <div>
                      <p className="text-xs font-bold text-stone-500 uppercase">Armamento Autorizado</p>
                      <p className={`text-sm font-bold ${isPast ? 'text-stone-600' : 'text-stone-900'}`}>{part.carriedWeapon}</p>
                      <p className="text-xs text-stone-600">{part.weaponModel}</p>
                    </div>
                  </div>
                </div>

                {/* Intercambiamos el botón por un bloque visual si ya pasó */}
                <div className="p-4 border-t border-stone-100 bg-stone-50">
                  {isPast ? (
                    <div className="w-full py-3 bg-stone-200 text-stone-500 font-bold rounded-lg flex items-center justify-center gap-2 border border-stone-300 cursor-not-allowed">
                      <Archive className="h-5 w-5" />
                      Expediente Archivado
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedQR(part)}
                      className="w-full py-3 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 bg-amber-800 hover:bg-amber-900"
                    >
                      <Calendar className="h-5 w-5" />
                      Mostrar Pase QR
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="bg-amber-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold tracking-widest uppercase text-sm">Control de Acceso</h3>
              <button onClick={() => setSelectedQR(null)} className="text-amber-200 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center bg-white">
              <div className="p-4 bg-white rounded-xl shadow-inner border border-stone-100 mb-6">
                <QRCodeSVG 
                  value={selectedQR.qrToken || 'TOKEN_NO_GENERADO'} 
                  size={200} 
                  level="H" 
                  includeMargin={true}
                />
              </div>
              
              <h2 className="text-2xl font-bold text-stone-900 text-center mb-1">{selectedQR.memberFullName}</h2>
              <p className="text-amber-800 font-bold mb-4">
                {events.find(e => e.id === selectedQR.eventId)?.city || selectedQR.eventCode}
              </p>
              <p className="text-xs text-stone-400 text-center font-mono bg-stone-100 px-3 py-2 rounded">
                {selectedQR.qrToken}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}