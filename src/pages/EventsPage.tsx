// src/pages/EventsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsService, type HistoricEvent } from '../services/events.service';
import { associationsService, type Association } from '../services/associations.service';
import { attendancesService, type EventAttendanceDto } from '../services/attendances.service';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Building, LockOpen, Lock, ShieldPlus, X, CheckCircle } from 'lucide-react';

export default function EventsPage() {
  const { state } = useAuth();
  const { user, myMemberships } = state;
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<HistoricEvent[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [attendanceModalEventId, setAttendanceModalEventId] = useState<number | null>(null);
  const [selectedAssociationId, setSelectedAssociationId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myAssociationIds = myMemberships.map(m => m.associationId);

  // Identificamos si es el Mando Supremo
  const isAdmin = user?.roles.some(role => ['ADMIN', 'ROLE_ADMIN'].includes(role));

  const isOfficer = user?.roles.some(role => 
    ['ADMIN', 'PRESIDENT', 'ROLE_ADMIN', 'ROLE_PRESIDENT'].includes(role)
  );

  const loadEventsAndAssociations = async () => {
    try {
      const [eventsData, assocsData] = await Promise.all([
        eventsService.getAll(),
        associationsService.getAll().catch(() => [])
      ]);
      setEvents(eventsData);
      setAssociations(assocsData);
    } catch (error: any) {
      setFeedback({ type: 'error', text: 'Error al cargar el mapa de operaciones.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEventsAndAssociations();
  }, []);

  const checkIsEnrolled = (event: HistoricEvent) => {
    if (!event.attendingAssociationIds || myAssociationIds.length === 0) return false;
    return event.attendingAssociationIds.some(id => myAssociationIds.includes(id));
  };

  const openAttendanceModal = (eventId: number) => {
    setAttendanceModalEventId(eventId);
    // Si no es Admin y solo tiene una asociación, se la preseleccionamos para mayor comodidad
    if (!isAdmin && myAssociationIds.length > 0) {
      setSelectedAssociationId(myAssociationIds[0].toString());
    } else {
      setSelectedAssociationId(''); 
    }
    setFeedback(null);
  };

  const closeAttendanceModal = () => {
    setAttendanceModalEventId(null);
  };

  const handleConfirmAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceModalEventId || !selectedAssociationId) return;

    setIsSubmitting(true);
    setFeedback(null);

    const dto: EventAttendanceDto = {
      eventId: attendanceModalEventId,
      associationId: Number(selectedAssociationId)
    };

    try {
      await attendancesService.enroll(dto);
      setFeedback({ type: 'success', text: 'Asociación adscrita correctamente a la campaña.' });
      closeAttendanceModal();
      
      // RECARGA AUTOMÁTICA
      await loadEventsAndAssociations();
      
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'La asociación ya está inscrita o hubo un error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">Campañas y Eventos</h1>
        <p className="text-stone-500 mt-2">Calendario oficial de recreaciones históricas.</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-md border-l-4 shadow-sm text-sm font-medium flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-green-50 border-green-700 text-green-800' : 'bg-red-50 border-red-700 text-red-800'
        }`}>
          {feedback.type === 'success' && <CheckCircle className="h-5 w-5" />}
          {feedback.text}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-stone-500 font-medium">Desplegando mapas tácticos...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-stone-500">No hay campañas programadas en este momento.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isEnrolled = checkIsEnrolled(event);

            return (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col relative">
                
                {isEnrolled && (
                  <div className="absolute top-12 right-2 bg-green-100 text-green-800 border border-green-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm z-10 animate-in zoom-in">
                    <CheckCircle className="h-4 w-4" />
                    Tropas Desplegadas
                  </div>
                )}

                <div className={`px-4 py-2 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-white ${event.eventType === 'PUBLIC' ? 'bg-amber-800' : 'bg-stone-700'}`}>
                  <span className="flex items-center gap-1">
                    {event.eventType === 'PUBLIC' ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {event.eventType === 'PUBLIC' ? 'Evento Público' : 'Maniobras Privadas'}
                  </span>
                  <span>{event.eventCode}</span>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900 mb-1 flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-stone-400 mt-1 flex-shrink-0" />
                      <span>{event.city}, {event.country}</span>
                    </h3>
                    <p className="text-sm text-stone-500 flex items-center gap-1 pl-7">
                      <Building className="h-4 w-4" />
                      Org: {event.organizingAssociationName || 'Comandancia General'}
                    </p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded border border-stone-100 flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-amber-800 mt-0.5" />
                    <div className="text-sm text-stone-700">
                      <p><span className="font-bold">Inicio:</span> {new Date(event.startDate).toLocaleDateString()}</p>
                      <p><span className="font-bold">Fin:</span> {new Date(event.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-stone-100 bg-stone-50 flex flex-col gap-3 min-h-[4rem]">
                  {isOfficer ? (
                    <>
                      <button 
                        onClick={() => openAttendanceModal(event.id!)}
                        className={`w-full py-2 px-4 border rounded font-bold transition-colors flex items-center justify-center gap-2 ${
                          isEnrolled 
                            ? 'bg-green-50 border-green-600 text-green-700 hover:bg-green-100'
                            : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <ShieldPlus className="h-4 w-4" />
                        {isEnrolled ? 'Modificar Despliegue' : 'Gestionar Inscripción'}
                      </button>
                      <button 
                        onClick={() => navigate(`/events/${event.id!}/manage`)}
                        className="w-full py-2 px-4 border border-amber-800 bg-amber-800 rounded text-white font-bold hover:bg-amber-900 transition-colors"
                      >
                        Mesa de Operaciones (Tropas)
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-stone-500 italic text-center py-2">
                      Contacta con la presidencia de tu asociación para solicitar el alistamiento a esta campaña.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {attendanceModalEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Adscribir Regimiento
              </h3>
              <button onClick={closeAttendanceModal} className="text-amber-200 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            
            <form onSubmit={handleConfirmAttendance} className="p-6 space-y-6">
              <p className="text-sm text-stone-600">Selecciona la asociación que participará oficialmente en esta campaña.</p>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Asociación / Regimiento</label>
                <select 
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800"
                  value={selectedAssociationId}
                  onChange={(e) => setSelectedAssociationId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Selecciona un regimiento --</option>
                  {/* FILTRO DE SEGURIDAD */}
                  {associations
                    .filter(assoc => isAdmin ? true : myAssociationIds.includes(assoc.id!))
                    .map(assoc => (
                    <option key={assoc.id} value={assoc.id}>{assoc.name}</option>
                  ))}
                </select>
              </div>
              <div className="border-t border-stone-200 pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeAttendanceModal} className="px-4 py-2 text-stone-600 font-bold hover:bg-stone-100 rounded">Cancelar</button>
                <button type="submit" disabled={isSubmitting || !selectedAssociationId} className="px-6 py-2 bg-amber-800 text-white font-bold rounded shadow hover:bg-amber-900 disabled:opacity-50">
                  {isSubmitting ? 'Registrando...' : 'Confirmar Adscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}