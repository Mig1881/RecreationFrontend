// src/pages/admin/WeaponsExportPage.tsx
import { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiClient';
import { participationsService, type EventParticipationDto } from '../../services/participations.service';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Download, FileText, Crosshair } from 'lucide-react';

export default function WeaponsExportPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const [participations, setParticipations] = useState<EventParticipationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { state } = useAuth();
  const { user, myMemberships } = state;
  const isAdmin = user?.roles.some(role => ['ADMIN', 'ROLE_ADMIN'].includes(role));
  const managedAssociationIds = myMemberships.map(m => m.associationId);

  // 1. Cargar la lista de eventos
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiClient<any[]>('/events');
        
        // Solo puedes exportar si eres Admin o si eres el ORGANIZADOR del evento.
        const allowedEvents = isAdmin 
          ? data 
          : data.filter(event => managedAssociationIds.includes(event.organizingAssociationId));

        setEvents(allowedEvents);
        
        if (allowedEvents.length > 0) {
          setSelectedEventId(allowedEvents[0].id.toString());
        }
      } catch (error: any) {
        setApiError('Error de comunicación al obtener las maniobras disponibles.');
      }
    };
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // 2. Cargar TODAS las armas del evento seleccionado
  useEffect(() => {
    if (!selectedEventId) return;
    
    const fetchArmedTroops = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await participationsService.getByEvent(Number(selectedEventId));
        
        const armed = data.filter(p => p.carriedWeapon && p.carriedWeapon.trim() !== '' && p.carriedWeapon !== 'Ninguna');

        setParticipations(armed);
      } catch (error: any) {
        setApiError('Error al obtener el censo de armamento para este evento.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArmedTroops();
  }, [selectedEventId]);

  // 3. Conexión nativa para descargar el CSV
  const handleDownloadCSV = async () => {
    if (!selectedEventId) return;
    
    try {
      setApiError(null);
      const token = localStorage.getItem('token'); 
      
      const response = await fetch(`http://localhost:8081/api/events/${selectedEventId}/export-participants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Capturamos el error 403 que ahora lanza tu backend de Spring Boot
        throw new Error('El Alto Mando denegó la exportación. No tienes autoridad sobre esta campaña.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `intervencion_armas_evento_${selectedEventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

    } catch (error: any) {
      setApiError(error.message || "Fallo crítico de comunicaciones al descargar el documento.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 inline-flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-amber-800" />
            Intervención de Armas
          </h1>
          <p className="text-stone-500 mt-2">
            Control de licencias y exportación del censo global para autoridades competentes.
          </p>
        </div>
        
        <button
          onClick={handleDownloadCSV}
          disabled={isLoading || participations.length === 0}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Download className="h-5 w-5 mr-2" />
          Descargar Padrón Oficial (CSV)
        </button>
      </div>

      <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 flex flex-col md:flex-row items-center gap-4">
        <label className="font-bold text-stone-700 whitespace-nowrap">
          Seleccionar Campaña:
        </label>
        <select 
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="block w-full md:w-[400px] pl-3 pr-10 py-2.5 border border-stone-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
        >
          {events.length === 0 ? (
            <option value="">No hay campañas bajo tu organización</option>
          ) : (
            events.map(event => (
              <option key={event.id} value={event.id}>
                {event.eventCode} - {event.city} ({event.startDate})
              </option>
            ))
          )}
        </select>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-700 rounded shadow-sm">
          {apiError}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-stone-200 overflow-hidden">
        <div className="bg-stone-100 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-800 font-bold">
            <FileText className="h-5 w-5 text-stone-500" />
            Dotación Armada Global para la Campaña Seleccionada
          </div>
          <span className="bg-amber-200 text-amber-900 py-1 px-3 rounded-full text-xs font-bold shadow-sm">
            {participations.length} tiradores inscritos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Combatiente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Tipo de Arma</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Modelo / Calibre</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-stone-500 font-medium">
                    Consultando archivos de la armería global...
                  </td>
                </tr>
              ) : participations.length > 0 ? (
                participations.map((part, index) => (
                  <tr key={part.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50 hover:bg-stone-100'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="bg-stone-200 rounded-full p-2">
                           <Crosshair className="h-4 w-4 text-stone-600"/>
                        </div>
                        <div className="text-sm font-bold text-stone-900">
                          {part.memberFullName || 'Identidad desconocida'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                        {part.carriedWeapon}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 font-medium">
                      {part.weaponModel}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-stone-500">
                    No hay tropas con registro de armamento para esta maniobra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}