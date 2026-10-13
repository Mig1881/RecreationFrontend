// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsService } from '../services/events.service';
import { associationsService } from '../services/associations.service';
import { participationsService } from '../services/participations.service';
import { membershipsService } from '../services/memberships.service';
import { membersService } from '../services/members.service';
import { 
  BarChart3, Users, MapPin, Crosshair, 
  ShieldAlert, Building, Swords, CalendarCheck,
  TrendingUp, Award
} from 'lucide-react';

export default function DashboardPage() {
  const { state } = useAuth();
  const { user, myMemberships } = state;
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

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

        } else if (isPresident) {
          // 📊 ESTADÍSTICAS DEL PRESIDENTE DE REGIMIENTO
          const events = await eventsService.getAll();
          
          // Calculamos eventos propios (organizados o adscritos)
          const myEvents = events.filter(e => 
            managedAssociationIds.includes(e.organizingAssociationId!) || 
            e.attendingAssociationIds?.some(id => managedAssociationIds.includes(id))
          );

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
            veterans: allTroops.length - activeTroops // Los que tienen endDate (baja)
          });

        } else {
          // 📊 ESTADÍSTICAS DEL RECREADOR BÁSICO
          const [myParts, events] = await Promise.all([
            participationsService.getByMember(user!.id),
            eventsService.getAll()
          ]);

          // Tipos de armas únicas que ha usado
          const uniqueWeapons = new Set(myParts.filter(p => p.carriedWeapon && p.carriedWeapon !== 'Ninguna').map(p => p.carriedWeapon)).size;
          
          // Buscar el próximo evento
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

  if (isLoading) return <div className="p-12 text-center text-stone-500">Recopilando inteligencia militar...</div>;

  // Componente reutilizable para las tarjetas (Gestalt: Similitud y Continuidad)
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
    <div className="space-y-6 animate-in fade-in duration-500">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
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
    </div>
  );
}