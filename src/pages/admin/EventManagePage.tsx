// src/pages/admin/EventManagePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService, type HistoricEvent } from '../../services/events.service';
import { membershipsService } from '../../services/memberships.service';
import { participationsService, type EventParticipationDto } from '../../services/participations.service';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ArrowLeft, Crosshair, ChevronLeft, ShieldAlert } from 'lucide-react';
import { type Member } from '../../services/members.service'; 

export default function EventManagePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const { state } = useAuth();
  const { user, myMemberships } = state;
  const isAdmin = user?.roles.some(role => ['ADMIN', 'ROLE_ADMIN'].includes(role));
  const managedAssociationIds = myMemberships.map(m => m.associationId);

  const [event, setEvent] = useState<HistoricEvent | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [deployedParticipations, setDeployedParticipations] = useState<EventParticipationDto[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);

  const [memberToDeploy, setMemberToDeploy] = useState<Member | null>(null);
  const [weaponType, setWeaponType] = useState('');
  const [weaponModel, setWeaponModel] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;
      try {
        const [eventData, participationsData] = await Promise.all([
          eventsService.getById(Number(eventId)),
          participationsService.getByEvent(Number(eventId)).catch(() => [])
        ]);
        
        // Puedes pasar si eres Admin, si eres Organizador, O si estás apuntado como Asistente
        const isOrganizer = managedAssociationIds.includes(eventData.organizingAssociationId!);
        const isAttendant = eventData.attendingAssociationIds?.some(id => managedAssociationIds.includes(id));
        
        if (!isAdmin && !isOrganizer && !isAttendant) {
          setIsAuthorized(false);
          setIsLoading(false);
          return; 
        }
        
        // Si es Admin, pide los de la organizadora para ver algo. 
        // Si es Presidente (organizador o asistente), pide los de su propio regimiento.
        const targetAssociationId = isAdmin 
            ? eventData.organizingAssociationId! 
            : managedAssociationIds[0];

        const membershipsData = await membershipsService.getByAssociation(targetAssociationId);
        
        const regimentMembers = membershipsData
          .filter((m: any) => !m.endDate)
          .map((m: any) => {
            const nameParts = m.memberFullName ? m.memberFullName.split(' ') : ['Desconocido'];
            return {
              id: m.memberId,
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' '),
              historicalRank: m.historicalRank,
              weaponLicense: m.weaponLicense
            } as Member;
          });

        setEvent(eventData);
        setAllMembers(regimentMembers); 
        // Si no somos admin, filtramos también las participaciones para ver SOLO a nuestra gente desplegada
        if (!isAdmin) {
          const myDeployed = participationsData.filter(p => 
            regimentMembers.some(rm => rm.id === p.memberId)
          );
          setDeployedParticipations(myDeployed);
        } else {
          setDeployedParticipations(participationsData);
        }

      } catch (error) {
        console.error("Error cargando la mesa de operaciones", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [eventId, isAdmin]);

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
  
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500 animate-in fade-in">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-stone-800">Campaña Restringida</h2>
        <p className="mt-2 text-center max-w-md">
          Este evento está bajo la jurisdicción de otro regimiento. Solo su Presidente o el Mando Supremo pueden gestionar el despliegue de tropas aquí.
        </p>
        <button 
          onClick={() => navigate('/admin/events/crud')}
          className="mt-6 px-4 py-2 bg-stone-200 text-stone-700 font-bold rounded hover:bg-stone-300 transition-colors"
        >
          Volver al Centro de Mando
        </button>
      </div>
    );
  }

  if (!event) return <div className="p-12 text-center text-red-500">Evento no encontrado.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <button onClick={() => navigate('/admin/events/crud')} className="flex items-center text-amber-800 hover:text-amber-900 font-bold text-sm mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver a Campañas
        </button>
        <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">
          Mesa de Operaciones
        </h1>
        <p className="text-stone-500 mt-2 text-lg font-medium">
          {event.eventCode} - {event.city} <span className="text-sm bg-stone-200 px-2 py-1 rounded ml-2">Organiza: {event.organizingAssociationName || `Asoc. #${event.organizingAssociationId}`}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna Izquierda: Disponibles */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col h-[600px]">
          <div className="bg-stone-100 p-4 border-b border-stone-200 flex justify-between items-center">
            <h2 className="font-bold text-stone-800">Cuartel General (Disponibles)</h2>
            <span className="bg-stone-200 text-stone-600 py-1 px-3 rounded-full text-sm">{availableMembers.length}</span>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {availableMembers.length === 0 ? (
               <div className="text-center text-stone-400 mt-10 p-4">No hay tropas disponibles en tu regimiento o todas han sido desplegadas.</div>
            ) : (
              availableMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg hover:border-amber-300 transition-colors">
                  <div>
                    <p className="font-bold text-stone-900">{member.lastName}, {member.firstName}</p>
                    <p className="text-xs text-stone-500">{member.historicalRank || 'Recluta'}</p>
                  </div>
                  <button 
                    onClick={() => handleInitiateDeployment(member)}
                    className="p-2 bg-amber-100 text-amber-900 rounded hover:bg-amber-800 hover:text-white transition-colors"
                    title="Desplegar tropa"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
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
                    className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                    title="Retirar tropa del frente"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="text-right flex-1 ml-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-stone-900 border-b border-stone-200 pb-3 mb-4">
              Equipamiento para {memberToDeploy.firstName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Tipo de Arma</label>
                <input type="text" value={weaponType} onChange={(e) => setWeaponType(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-amber-800 outline-none transition-shadow" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Modelo Exacto</label>
                <input type="text" value={weaponModel} onChange={(e) => setWeaponModel(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-amber-800 outline-none transition-shadow" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setMemberToDeploy(null)} className="px-4 py-2 text-stone-600 font-bold hover:bg-stone-100 rounded transition-colors">Cancelar</button>
              <button onClick={confirmDeployment} className="px-4 py-2 bg-amber-800 text-white font-bold rounded shadow hover:bg-amber-900 transition-colors flex items-center gap-2">Confirmar Despliegue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}