// src/pages/admin/EventManagePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService, type HistoricEvent } from '../../services/events.service';
import { membersService, type Member } from '../../services/members.service';
import { participationsService, type EventParticipationDto } from '../../services/participations.service';
import { ArrowRight, ArrowLeft, Crosshair, ChevronLeft } from 'lucide-react';

export default function EventManagePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<HistoricEvent | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [deployedParticipations, setDeployedParticipations] = useState<EventParticipationDto[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Estado para el modal de armamento
  const [memberToDeploy, setMemberToDeploy] = useState<Member | null>(null);
  const [weaponType, setWeaponType] = useState('');
  const [weaponModel, setWeaponModel] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;
      try {
        const [eventData, membersData, participationsData] = await Promise.all([
          eventsService.getById(Number(eventId)),
          membersService.getAll(),
          participationsService.getByEvent(Number(eventId)).catch(() => [])
        ]);
        
        setEvent(eventData);
        setAllMembers(membersData);
        setDeployedParticipations(participationsData); // Datos limpios gracias a tu DTO
      } catch (error) {
        console.error("Error cargando la mesa de operaciones", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [eventId]);

  // Tropas disponibles (filtramos los que ya están en la lista de participaciones)
  const availableMembers = allMembers.filter(
    member => !deployedParticipations.some(p => p.memberId === member.id)
  );

  const handleInitiateDeployment = (member: Member) => {
    setMemberToDeploy(member);
    setWeaponType(member.weaponLicense ? 'Mosquete' : 'Ninguna');
    setWeaponModel('');
  };

  const confirmDeployment = async () => {
    if (!memberToDeploy || !eventId) return;

    const dto: EventParticipationDto = {
      eventId: Number(eventId),
      memberId: memberToDeploy.id,
      carriedWeapon: weaponType || 'Ninguna',
      weaponModel: weaponModel || 'N/A'
    };

    try {
      const newParticipation = await participationsService.enroll(dto);
      // Como tu backend devuelve el DTO completo con el nombre, lo metemos directo
      setDeployedParticipations(prev => [...prev, newParticipation]);
      setMemberToDeploy(null);
    } catch (error) {
      alert('Error al desplegar la tropa.');
    }
  };

  const handleRemoveTroop = async (participationId?: number) => {
    if (!participationId) return;
    try {
      await participationsService.remove(participationId);
      setDeployedParticipations(prev => prev.filter(p => p.id !== participationId));
    } catch (error) {
      alert('Error al retirar la tropa.');
    }
  };

  if (isLoading) return <div className="p-12 text-center text-stone-500">Preparando mapas tácticos...</div>;
  if (!event) return <div className="p-12 text-center text-red-500">Evento no encontrado.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <button onClick={() => navigate('/events')} className="flex items-center text-amber-800 hover:text-amber-900 font-bold text-sm mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver al Calendario
        </button>
        <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">
          Mesa de Operaciones
        </h1>
        <p className="text-stone-500 mt-2 text-lg font-medium">{event.eventCode} - {event.city}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna Izquierda: Disponibles */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col h-[600px]">
          <div className="bg-stone-100 p-4 border-b border-stone-200 flex justify-between items-center">
            <h2 className="font-bold text-stone-800">Cuartel General (Disponibles)</h2>
            <span className="bg-stone-200 text-stone-600 py-1 px-3 rounded-full text-sm">{availableMembers.length}</span>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {availableMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg hover:border-amber-300">
                <div>
                  <p className="font-bold text-stone-900">{member.lastName}, {member.firstName}</p>
                  <p className="text-xs text-stone-500">{member.historicalRank || 'Recluta'}</p>
                </div>
                <button 
                  onClick={() => handleInitiateDeployment(member)}
                  className="p-2 bg-amber-100 text-amber-900 rounded hover:bg-amber-800 hover:text-white"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Desplegados */}
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm flex flex-col h-[600px] border-t-4 border-t-amber-800">
          <div className="bg-amber-50 p-4 border-b border-amber-200 flex justify-between items-center">
            <h2 className="font-bold text-amber-900">Frente de Batalla (Desplegados)</h2>
            <span className="bg-amber-200 text-amber-900 py-1 px-3 rounded-full text-sm">{deployedParticipations.length}</span>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {deployedParticipations.length === 0 ? (
              <div className="text-center text-stone-400 mt-10">Ninguna tropa asignada a esta campaña.</div>
            ) : (
              deployedParticipations.map(participation => (
                <div key={participation.id} className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg shadow-sm">
                  <button 
                    onClick={() => handleRemoveTroop(participation.id)}
                    className="p-2 text-stone-400 hover:text-red-600"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="text-right flex-1 ml-4">
                    {/* Renderizamos directamente el nombre que nos envía el backend */}
                    <p className="font-bold text-stone-900">{participation.memberFullName}</p>
                    <p className="text-xs text-amber-700 font-medium flex items-center justify-end gap-1 mt-1">
                      <Crosshair className="h-3 w-3" />
                      {participation.carriedWeapon} ({participation.weaponModel})
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal Intermedio de Armamento */}
      {memberToDeploy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-stone-900 border-b border-stone-200 pb-3 mb-4">
              Equipamiento para {memberToDeploy.firstName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Tipo de Arma</label>
                <input type="text" value={weaponType} onChange={(e) => setWeaponType(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Modelo Exacto</label>
                <input type="text" value={weaponModel} onChange={(e) => setWeaponModel(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setMemberToDeploy(null)} className="px-4 py-2 text-stone-600 font-bold hover:bg-stone-100 rounded">Cancelar</button>
              <button onClick={confirmDeployment} className="px-4 py-2 bg-amber-800 text-white font-bold rounded shadow hover:bg-amber-900">Confirmar Despliegue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}