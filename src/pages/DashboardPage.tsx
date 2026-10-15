// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsService, type HistoricEvent } from '../services/events.service';
import { associationsService, type Association } from '../services/associations.service';
import { participationsService, type EventParticipationDto } from '../services/participations.service';
import { membershipsService } from '../services/memberships.service';
import { membersService } from '../services/members.service';
import { 
  BarChart3, Users, MapPin, Crosshair, 
  ShieldAlert, Building, Swords, CalendarCheck,
  TrendingUp, Award, ChevronDown, ChevronUp, FileText
} from 'lucide-react';

export default function DashboardPage() {
  const { state } = useAuth();
  const { user, myMemberships } = state;
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  // ESTADOS PARA LA TABLA MASTER-DETAIL (COMPARTIDA ADMIN/PRESIDENT) 
  const [tableEvents, setTableEvents] = useState<HistoricEvent[]>([]);
  const [systemAssociations, setSystemAssociations] = useState<Association[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [expandedTroops, setExpandedTroops] = useState<EventParticipationDto[]>([]);
  const [isLoadingTroops, setIsLoadingTroops] = useState(false);

  const isAdmin = user?.roles.some(role => ['ADMIN', 'ROLE_ADMIN'].includes(role));
  const isPresident = user?.roles.some(role => ['PRESIDENT', 'ROLE_PRESIDENT'].includes(role));
  const managedAssociationIds = myMemberships.map(m => m.associationId);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAdmin) {
          // 📊 ESTADÍSTICAS DEL MANDO SUPREMO (ADMIN)
          const [events, assocs, members] = await Promise.all([
            eventsService.getAll(),
            associationsService.getAll(),
            membersService.getAll()
          ]);

          const publicEvents = events.filter(e => e.eventType === 'PUBLIC').length;
          const privateEvents = events.length - publicEvents;

          setStats({
            totalAssocs: assocs.length,
            totalMembers: members.length,
            totalEvents: events.length,
            ratioEvents: `${publicEvents} Púb. / ${privateEvents} Priv.`
          });

          // Cargamos todos los eventos y asociaciones para el visor
          setTableEvents(events);
          setSystemAssociations(assocs);

        } else if (isPresident) {
          // 📊 ESTADÍSTICAS DEL PRESIDENTE DE REGIMIENTO
          const [events, assocs] = await Promise.all([
            eventsService.getAll(),
            associationsService.getAll()
          ]);
          
          setSystemAssociations(assocs);

          // Calculamos eventos propios para las métricas (organizados o adscritos)
          const myEvents = events.filter(e => 
            managedAssociationIds.includes(e.organizingAssociationId!) || 
            e.attendingAssociationIds?.some(id => managedAssociationIds.includes(id))
          );

          // EVENTOS PARA LA TABLA: Solo los que organiza como anfitrión 
          const organizedEvents = events.filter(e => 
            managedAssociationIds.includes(e.organizingAssociationId!)
          );
          setTableEvents(organizedEvents);

          // Obtenemos todas las tropas de las asociaciones que preside
          const troopsPromises = managedAssociationIds.map(id => membershipsService.getByAssociation(id));
          const troopsArrays = await Promise.all(troopsPromises);
          const allTroops = troopsArrays.flat();

          const activeTroops = allTroops.filter((t: any) => !t.endDate).length;
          const armedTroops = allTroops.filter((t: any) => t.weaponLicense).length;

          setStats({
            activeTroops,
            armedTroops,
            totalEvents: myEvents.length,
            veterans: allTroops.length - activeTroops
          });

        } else {
          // 📊 ESTADÍSTICAS DEL RECREADOR BÁSICO
          const [myParts, events] = await Promise.all([
            participationsService.getByMember(user!.id),
            eventsService.getAll()
          ]);

          const uniqueWeapons = new Set(myParts.filter(p => p.carriedWeapon && p.carriedWeapon !== 'Ninguna').map(p => p.carriedWeapon)).size;
          
          const today = new Date();
          today.setHours(0,0,0,0);
          
          let nextMission = "Sin asignar";
          const futureParts = myParts.map(p => {
            const ev = events.find(e => e.id === p.eventId);
            return ev ? { ...p, startDate: new Date(ev.startDate) } : null;
          }).filter(p => p && p.startDate >= today)
            .sort((a: any, b: any) => a.startDate - b.startDate);

          if (futureParts.length > 0) {
            nextMission = futureParts[0]!.eventCode || "Próxima Misión";
          }

          setStats({
            totalDeployments: myParts.length,
            uniqueWeapons,
            totalRegiments: myMemberships.length,
            nextMission
          });
        }
      } catch (error) {
        console.error("Error calculando analíticas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, isPresident, user, managedAssociationIds]);

  // LÓGICA LAZY LOADING: Cargar tropas solo al expandir un evento
  const toggleEventExpand = async (eventId: number) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      return;
    }
    
    setExpandedEventId(eventId);
    setIsLoadingTroops(true);
    try {
      const troops = await participationsService.getByEvent(eventId);
      setExpandedTroops(troops);
    } catch (error) {
      console.error("Error al cargar el despliegue", error);
      setExpandedTroops([]);
    } finally {
      setIsLoadingTroops(false);
    }
  };

  const getAssocName = (id: number) => {
    return systemAssociations.find(a => a.id === id)?.name || `Asoc #${id}`;
  };

  if (isLoading) return <div className="p-12 text-center text-stone-500">Recopilando inteligencia militar...</div>;

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-amber-50 rounded-lg text-amber-800">
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <p className="text-sm font-bold text-stone-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-stone-900 mt-1">{value}</h3>
        <p className="text-xs text-stone-400 mt-2">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Centro de Inteligencia
        </h1>
        <p className="text-stone-500 mt-2">
          {isAdmin ? 'Métricas globales del Mando Central.' : 
           isPresident ? 'Estado operativo de tus regimientos.' : 
           'Tu hoja de servicios y expediente personal.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isAdmin && (
          <>
            <StatCard title="Regimientos Activos" value={stats.totalAssocs} icon={Building} description="Asociaciones adscritas al sistema" />
            <StatCard title="Fuerza Total" value={stats.totalMembers} icon={Users} description="Recreadores registrados en base de datos" />
            <StatCard title="Campañas Históricas" value={stats.totalEvents} icon={MapPin} description="Eventos planificados y finalizados" />
            <StatCard title="Ratio Operativo" value={stats.ratioEvents} icon={TrendingUp} description="Proporción de tipos de maniobra" />
          </>
        )}

        {(!isAdmin && isPresident) && (
          <>
            <StatCard title="Tropas en Filas" value={stats.activeTroops} icon={Users} description="Recreadores activos en tu jurisdicción" />
            <StatCard title="Campañas Adscritas" value={stats.totalEvents} icon={ShieldAlert} description="Eventos organizados o como invitados" />
            <StatCard title="Armería Activa" value={stats.armedTroops} icon={Crosshair} description="Tropas con licencia de armas vigente" />
            <StatCard title="Licenciados / Bajas" value={stats.veterans} icon={Award} description="Recreadores inactivos en el histórico" />
          </>
        )}

        {(!isAdmin && !isPresident) && (
          <>
            <StatCard title="Despliegues Totales" value={stats.totalDeployments} icon={Swords} description="Participaciones en campo de batalla" />
            <StatCard title="Arsenal Dominado" value={stats.uniqueWeapons} icon={Crosshair} description="Variedad de armas utilizadas" />
            <StatCard title="Unidades Asignadas" value={stats.totalRegiments} icon={Building} description="Regimientos a los que perteneces" />
            <StatCard title="Estado Actual" value={stats.nextMission} icon={CalendarCheck} description={stats.nextMission === 'Sin asignar' ? 'A la espera de órdenes' : 'Siguiente movilización confirmada'} />
          </>
        )}
      </div>

      {/* Bloque 2: Master-Detail Exclusivo para el Admin y Presidentes */}
      {(isAdmin || isPresident) && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-6 w-6 text-amber-800" />
            <h2 className="text-2xl font-bold text-stone-800">
              {isAdmin ? 'Visor Estratégico de Movilizaciones' : 'Visor Táctico de tus Campañas'}
            </h2>
          </div>
          <p className="text-stone-500 mb-6">
            {isAdmin 
              ? 'Despliega cualquier campaña para auditar las unidades y asociaciones adscritas.' 
              : 'Audita las operaciones donde tu regimiento actúa como anfitrión organizador.'}
          </p>

          <div className="bg-white shadow-md rounded-xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Campaña y Ubicación</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Mando Organizador</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Regimientos Adscritos</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-stone-600 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {tableEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-stone-500">
                        {isAdmin ? 'No hay operaciones registradas.' : 'Tu regimiento no organiza ninguna campaña actualmente.'}
                      </td>
                    </tr>
                  ) : (
                    tableEvents.map((event) => (
                      <React.Fragment key={event.id}>
                        {/* FILA MAESTRA (Master) */}
                        <tr 
                          className={`transition-colors hover:bg-amber-50 cursor-pointer ${expandedEventId === event.id ? 'bg-amber-50' : ''}`}
                          onClick={() => toggleEventExpand(event.id!)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-stone-900">{event.eventCode}</div>
                            <div className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {event.city}, {event.country}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-stone-700">
                            {getAssocName(event.organizingAssociationId!)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {(!event.attendingAssociationIds || event.attendingAssociationIds.length === 0) ? (
                                <span className="text-xs text-stone-400 italic">Ninguna asociación invitada</span>
                              ) : (
                                event.attendingAssociationIds.map(id => (
                                  <span key={id} className="bg-stone-100 border border-stone-200 text-stone-600 text-[10px] uppercase font-bold px-2 py-1 rounded">
                                    {getAssocName(id)}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-amber-800 hover:text-amber-600 flex items-center justify-end w-full gap-1 font-bold text-sm">
                              {expandedEventId === event.id ? (
                                <>Ocultar <ChevronUp className="h-5 w-5" /></>
                              ) : (
                                <>Ver Despliegue <ChevronDown className="h-5 w-5" /></>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* FILA DETALLE (Detail) */}
                        {expandedEventId === event.id && (
                          <tr className="bg-stone-50 border-b-2 border-stone-300">
                            <td colSpan={4} className="px-6 py-6">
                              <div className="bg-white rounded-lg border border-amber-200 shadow-inner p-4 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-sm font-bold text-amber-900 mb-4 flex items-center gap-2 border-b border-amber-100 pb-2">
                                  <FileText className="h-4 w-4" /> Desglose de Recreadores Movilizados
                                </h4>
                                
                                {isLoadingTroops ? (
                                  <div className="text-center text-stone-500 py-4 text-sm">Consultando registros al Cuartel General...</div>
                                ) : expandedTroops.length === 0 ? (
                                  <div className="text-center text-stone-400 py-4 text-sm italic">No se han desplegado tropas para esta campaña.</div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {expandedTroops.map(troop => (
                                      <div key={troop.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded border border-stone-200 hover:border-amber-300 transition-colors">
                                        <div className="bg-amber-100 text-amber-800 p-2 rounded-full">
                                          <Users className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-sm text-stone-900">{troop.memberFullName}</p>
                                          <div className="text-xs text-stone-600 mt-1 flex items-center gap-1">
                                            <Crosshair className="h-3 w-3 text-stone-400" />
                                            {troop.carriedWeapon === 'Ninguna' 
                                              ? 'Desarmado / Infantería' 
                                              : `${troop.carriedWeapon} (${troop.weaponModel})`}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}