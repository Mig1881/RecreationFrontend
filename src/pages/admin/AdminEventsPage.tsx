// src/pages/admin/AdminEventsPage.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { eventsService, type HistoricEvent, type PublicEvent, type PrivateEvent } from '../../services/events.service';
import { associationsService, type Association } from '../../services/associations.service';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Edit, Trash2, Plus, X, LockOpen, Lock, CalendarDays } from 'lucide-react';

interface EventFormData {
  eventCode: string;
  eventType: 'PUBLIC' | 'PRIVATE';
  organizingAssociationId?: string | number;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  cost?: number;
  published: boolean;
  publicEntity?: string;
  subsidy?: number;
  sponsor?: string;
  initialBudget?: number;
  openToPublic?: boolean;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<HistoricEvent[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { state } = useAuth();
  const { user, myMemberships } = state;
  const isAdmin = user?.roles.some(role => ['ADMIN', 'ROLE_ADMIN'].includes(role));
  const managedAssociationIds = myMemberships.map(m => m.associationId);

  const { register, handleSubmit, reset, watch } = useForm<EventFormData>();
  const watchedEventType = watch('eventType', 'PUBLIC');

  const loadData = async () => {
    try {
      const [eventsData, assocData] = await Promise.all([
        eventsService.getAll(),
        associationsService.getAll().catch(() => [])
      ]);
      setEvents(eventsData);
      setAssociations(assocData);
    } catch (error) {
      setFeedback({ type: 'error', text: 'Error al cargar los partes de campaña.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const visibleEvents = events.filter(event => {
    if (isAdmin) return true;
    return managedAssociationIds.includes(event.organizingAssociationId!);
  });

  const openModal = (event?: HistoricEvent) => {
    setFeedback(null);
    if (event) {
      setEditingId(event.id!);
      
      const formData: any = {
        eventCode: event.eventCode,
        eventType: event.eventType,
        organizingAssociationId: event.organizingAssociationId || '',
        country: event.country,
        city: event.city,
        startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        cost: event.cost || 0,
        published: event.published
      };

      if (event.eventType === 'PUBLIC') {
        formData.publicEntity = (event as PublicEvent).publicEntity;
        formData.subsidy = (event as PublicEvent).subsidy;
      } else {
        formData.sponsor = (event as PrivateEvent).sponsor;
        formData.initialBudget = (event as PrivateEvent).initialBudget;
        formData.openToPublic = (event as PrivateEvent).openToPublic;
      }

      reset(formData);
    } else {
      setEditingId(null);
      const defaultAssoc = !isAdmin && managedAssociationIds.length > 0 ? managedAssociationIds[0].toString() : '';
      reset({ eventCode: '', eventType: 'PUBLIC', country: 'España', city: '', published: false, organizingAssociationId: defaultAssoc });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const onSubmit = async (data: EventFormData) => {
    setFeedback(null);
    let payload: any; 

    let finalAssociationId = data.organizingAssociationId;
    if (!isAdmin) {
       if(!managedAssociationIds.includes(Number(finalAssociationId))) {
           setFeedback({ type: 'error', text: 'Violación de seguridad: No puedes crear campañas en nombre de otro regimiento.' });
           return;
       }
    }

    const organizingAssociationPayload = finalAssociationId 
      ? { id: Number(finalAssociationId) } 
      : null;

    const basePayload = {
      eventCode: data.eventCode,
      country: data.country,
      city: data.city,
      startDate: data.startDate,
      endDate: data.endDate,
      published: data.published,
      cost: data.cost || 0,
      organizingAssociation: organizingAssociationPayload
    };

    if (data.eventType === 'PUBLIC') {
      payload = {
        ...basePayload,
        eventType: 'PUBLIC',
        publicEntity: data.publicEntity || 'Sin especificar',
        subsidy: data.subsidy || 0
      };
    } else {
      payload = {
        ...basePayload,
        eventType: 'PRIVATE',
        sponsor: data.sponsor || 'Sin patrocinador',
        initialBudget: data.initialBudget || 0,
        openToPublic: data.openToPublic || false
      };
    }

    try {
      if (editingId) {
        await eventsService.update(editingId, payload);
        setFeedback({ type: 'success', text: 'Campaña actualizada con éxito.' });
      } else {
        await eventsService.create(payload);
        setFeedback({ type: 'success', text: 'Nueva campaña programada y enviada a los cuarteles.' });
      }
      closeModal();
      loadData();
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Error estratégico al planificar la campaña.' });
    }
  };
  
  const handleDelete = async (id: number, code: string) => {
    if (!window.confirm(`¿Estás seguro de cancelar definitivamente la campaña ${code}?`)) return;
    try {
      await eventsService.delete(id);
      setFeedback({ type: 'success', text: 'Campaña cancelada y eliminada de los registros.' });
      loadData();
    } catch (error) {
      setFeedback({ type: 'error', text: 'No se puede eliminar. Existen tropas o asociaciones desplegadas en este evento.' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">
            Gestión de Campañas
          </h1>
          <p className="text-stone-500 mt-2">Planificación del calendario oficial de recreaciones.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white font-bold rounded-md hover:bg-amber-900 shadow-sm">
          <Plus className="h-5 w-5" /> Programar Campaña
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-md border-l-4 shadow-sm text-sm font-medium ${feedback.type === 'success' ? 'bg-green-50 border-green-700 text-green-800' : 'bg-red-50 border-red-700 text-red-800'}`}>
          {feedback.text}
        </div>
      )}

      {/* Tabla de Eventos */}
      <div className="bg-white shadow-sm rounded-lg border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase">Campaña / Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase">Fechas</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-stone-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-500">Recopilando mapas...</td></tr>
              ) : visibleEvents.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-500">No hay campañas programadas en tu jurisdicción.</td></tr>
              ) : (
                visibleEvents.map((event, index) => (
                  <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {event.eventType === 'PUBLIC' ? <LockOpen className="h-5 w-5 text-amber-800" /> : <Lock className="h-5 w-5 text-stone-600" />}
                        <div>
                          <div className="font-bold text-stone-900">{event.eventCode}</div>
                          <div className="text-xs text-stone-500">{event.eventType === 'PUBLIC' ? 'Público' : 'Maniobra Privada'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-stone-700 flex items-center gap-1"><MapPin className="h-4 w-4 text-stone-400"/> {event.city}</div>
                      <div className="text-xs text-stone-500 ml-5">{event.country}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-stone-700 flex items-center gap-1"><CalendarDays className="h-4 w-4 text-stone-400"/> {new Date(event.startDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => openModal(event)} className="text-amber-600 hover:text-amber-900"><Edit className="h-5 w-5 inline" /></button>
                      <button onClick={() => handleDelete(event.id!, event.eventCode)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5 inline" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 animate-in zoom-in-95 duration-200">
            <div className="bg-amber-900 px-6 py-4 flex justify-between items-center text-white rounded-t-xl">
              <h3 className="text-xl font-bold">{editingId ? 'Reprogramar Campaña' : 'Diseñar Nueva Campaña'}</h3>
              <button onClick={closeModal} className="text-amber-200 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-stone-200 pb-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Código de Operación</label>
                  <input type="text" placeholder="Ej: EV-ZAR-2026" className="w-full px-3 py-2 border rounded bg-stone-50 focus:ring-1 focus:ring-amber-800" {...register('eventCode', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Asociación Organizadora</label>
                  <select 
                    className={`w-full px-3 py-2 border rounded bg-stone-50 outline-none ${!isAdmin ? 'pointer-events-none opacity-60 bg-stone-200' : ''}`} 
                    {...register('organizingAssociationId', { required: true })} 
                    tabIndex={!isAdmin ? -1 : 0}
                  >
                    <option value="" disabled>-- Selecciona un regimiento --</option>
                    {associations
                        .filter(a => isAdmin ? true : managedAssociationIds.includes(a.id!))
                        .map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Tipo de Evento</label>
                  {/* 🔥 ARREGLO DEFINITIVO: Sin input hidden, congelamos visualmente el select real */}
                  <select 
                    className={`w-full px-3 py-2 border rounded font-bold outline-none ${editingId ? 'pointer-events-none opacity-60 bg-stone-200 text-stone-500' : 'bg-stone-50'}`} 
                    {...register('eventType', { required: true })}
                    tabIndex={editingId ? -1 : 0}
                  >
                    <option value="PUBLIC">Recreación Pública</option>
                    <option value="PRIVATE">Maniobras Privadas</option>
                  </select>
                </div>
              </div>

              {/* Zona Dinámica (Ley de Continuidad Gestalt) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-stone-200 pb-6 bg-stone-50 p-4 rounded border">
                <div className="md:col-span-2">
                  <h4 className="text-sm uppercase tracking-wide font-bold text-stone-500 mb-3 flex items-center gap-2">
                    {watchedEventType === 'PUBLIC' ? <LockOpen className="h-4 w-4"/> : <Lock className="h-4 w-4"/>}
                    Logística del evento {watchedEventType === 'PUBLIC' ? 'Público' : 'Privado'}
                  </h4>
                </div>

                {watchedEventType === 'PUBLIC' ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Entidad Pública</label>
                      <input type="text" placeholder="Ej: Ayuntamiento de Zaragoza" className="w-full px-3 py-2 border rounded outline-none focus:ring-1 focus:ring-amber-800" {...register('publicEntity', { required: watchedEventType === 'PUBLIC' })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Subvención (€)</label>
                      <input type="number" step="0.01" className="w-full px-3 py-2 border rounded outline-none focus:ring-1 focus:ring-amber-800" {...register('subsidy', { valueAsNumber: true })} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Patrocinador</label>
                      <input type="text" placeholder="Ej: Asociación Histórica" className="w-full px-3 py-2 border rounded outline-none focus:ring-1 focus:ring-amber-800" {...register('sponsor', { required: watchedEventType === 'PRIVATE' })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Presupuesto Inicial (€)</label>
                      <input type="number" step="0.01" className="w-full px-3 py-2 border rounded outline-none focus:ring-1 focus:ring-amber-800" {...register('initialBudget', { valueAsNumber: true })} />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2 mt-2">
                      <input type="checkbox" id="openToPublic" className="h-4 w-4 text-amber-800" {...register('openToPublic')} />
                      <label htmlFor="openToPublic" className="text-sm font-bold text-stone-700 cursor-pointer">Permitir acceso al público general</label>
                    </div>
                  </>
                )}
                
                <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                   <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">País</label>
                      <input type="text" className="w-full px-3 py-2 border rounded outline-none focus:ring-1 focus:ring-amber-800" {...register('country', { required: true })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Ciudad</label>
                      <input type="text" className="w-full px-3 py-2 border rounded outline-none focus:ring-1 focus:ring-amber-800" {...register('city', { required: true })} />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Fecha de Inicio</label>
                  <input type="date" className="w-full px-3 py-2 border rounded bg-stone-50 outline-none focus:ring-1 focus:ring-amber-800" {...register('startDate', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Fecha de Fin</label>
                  <input type="date" className="w-full px-3 py-2 border rounded bg-stone-50 outline-none focus:ring-1 focus:ring-amber-800" {...register('endDate', { required: true })} />
                </div>
              </div>

              <div className="mt-6 border-t border-stone-200 pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-stone-600 font-bold hover:bg-stone-100 rounded transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded shadow transition-colors">
                  {editingId ? 'Confirmar Modificaciones' : 'Emitir Orden de Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}