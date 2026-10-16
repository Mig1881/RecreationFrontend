// src/pages/admin/MembersPage.tsx
import { useState, useEffect } from 'react';
import RecruitModal from '../../components/members/RecruitModal';
import { type Member } from '../../services/members.service';
import { membershipsService} from '../../services/memberships.service';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/apiClient';
import { Search, ChevronLeft, ChevronRight, UserCog, UserMinus, ShieldAlert, UserPlus, RefreshCcw } from 'lucide-react';
import ProfileModal from '../../components/layout/ProfileModal';

interface TableMember extends Member {
  membershipId?: number;
  endDate?: string | null;
  associationName?: string; 
}

export default function MembersPage() {
  const { state } = useAuth();
  const { user, myMemberships } = state;

  const isAdmin = user?.roles.some(role => ['ADMIN', 'ROLE_ADMIN'].includes(role));
  const isPresident = user?.roles.some(role => ['PRESIDENT', 'ROLE_PRESIDENT'].includes(role));
  
  const managedAssociationIds = myMemberships.map(m => m.associationId);

  const [members, setMembers] = useState<TableMember[]>([]);
  const [adminAssociations, setAdminAssociations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'RESERVE' | 'ALL'>('ACTIVE');
  const [selectedAdminAssociation, setSelectedAdminAssociation] = useState<string>('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);

  // 1. Cargar el catálogo de asociaciones para el Admin
  useEffect(() => {
    const fetchAssociations = async () => {
      if (isAdmin) {
        try {
          const data = await apiClient<any[]>('/associations');
          setAdminAssociations(data);
        } catch (error) {
          console.error("Error al cargar asociaciones para el desplegable del admin:", error);
        }
      }
    };
    fetchAssociations();
  }, [isAdmin]);

  // 2. Cargar expedientes de forma unificada (Presidente y Admin)
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      let membershipsData: any[] = [];

      if (isAdmin) {
        // Precaución: Si aún no se han cargado las asociaciones, esperamos
        if (adminAssociations.length === 0) return;

        if (selectedAdminAssociation === 'ALL') {
          // Pedimos los expedientes de TODOS los regimientos y cruzamos el nombre
          const promises = adminAssociations.map(assoc => 
            membershipsService.getByAssociation(assoc.id).then(data => 
              data.map((m: any) => ({ ...m, associationName: assoc.name }))
            ).catch(() => [])
          );
          const results = await Promise.all(promises);
          membershipsData = results.flat();
        } else {
          // Solo los del regimiento seleccionado
          const assoc = adminAssociations.find(a => a.id.toString() === selectedAdminAssociation);
          const data = await membershipsService.getByAssociation(Number(selectedAdminAssociation));
          membershipsData = data.map((m: any) => ({ ...m, associationName: assoc?.name }));
        }
      } else if (isPresident && managedAssociationIds.length > 0) {
        const myRegimentId = managedAssociationIds[0];
        membershipsData = await membershipsService.getByAssociation(myRegimentId);
      }

      // Mapeo unificado para la tabla
      const mappedMembers: TableMember[] = membershipsData.map((m: any) => {
        const nameParts = m.memberFullName ? m.memberFullName.split(' ') : ['Desconocido'];
        const fName = nameParts[0];
        const lName = nameParts.slice(1).join(' ');

        return {
          id: m.memberId,
          membershipId: m.id,
          nationalId: m.nationalId || '---', 
          firstName: fName,
          lastName: lName,
          email: m.email || 'Sin correo',
          role: 'member',
          historicalRank: m.historicalRank || 'Recluta',
          weaponLicense: m.weaponLicense || '',
          endDate: m.endDate,
          associationName: m.associationName
        };
      });

      setMembers(mappedMembers);
    } catch (error: any) {
      setApiError(error.message || 'Error al obtener el listado de tropas.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Vigilar los cambios para recargar la tabla
  useEffect(() => {
    // Solo recargamos si somos Presidente o si somos Admin Y ya tenemos la lista de asociaciones
    if (isPresident || (isAdmin && adminAssociations.length > 0)) {
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isPresident, selectedAdminAssociation, adminAssociations]);

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.associationName && member.associationName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isLicenciado = !!member.endDate;
    
    if (filterStatus === 'ACTIVE' && isLicenciado) return false;
    if (filterStatus === 'RESERVE' && !isLicenciado) return false;
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handleLicenciar = async (member: TableMember) => {
    if (!member.membershipId) {
      alert("Error: No se ha detectado el ID de adscripción.");
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas licenciar (dar de baja) al recreador ${member.firstName} ${member.lastName}? Su historial se mantendrá en los archivos de tu asociación.`)) {
      try {
        await membershipsService.licenciar(member.membershipId);
        await fetchMembers();
      } catch (error: any) {
        setApiError(error.message || "Error de comunicación con el Alto Mando al tramitar la licencia.");
      }
    }
  };

  const handleReactivar = async (member: TableMember) => {
    if (!member.membershipId) {
      alert("Error: No se ha detectado el ID de adscripción.");
      return;
    }

    if (window.confirm(`¿Deseas volver a llamar a filas a ${member.firstName} ${member.lastName}? Volverá a estar en servicio activo en tu regimiento.`)) {
      try {
        await membershipsService.reactivar(member.membershipId);
        await fetchMembers();
      } catch (error: any) {
        setApiError(error.message || "Error de comunicación con el Alto Mando al tramitar la reactivación.");
      }
    }
  };

  if (!isAdmin && !isPresident) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-stone-800">Acceso Denegado</h2>
        <p>No tienes autoridad para acceder al censo de tropas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">
              Registro de Recreadores
            </h1>
            {isAdmin && (
              <span className="bg-amber-900 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                Modo Mando Supremo
              </span>
            )}
          </div>
          <p className="text-stone-500 mb-5">
            {isAdmin 
              ? 'Gestión global del censo oficial de la Asociación Napoleónica Española.' 
              : 'Gestión de las tropas adscritas a tu comandancia.'}
          </p>

          {(isPresident || isAdmin) && (
            <button 
              onClick={() => {
                if (isAdmin && selectedAdminAssociation === 'ALL') {
                  alert("Atención Mando Supremo: Seleccione un regimiento específico en el desplegable superior derecho antes de alistar a una unidad.");
                  return;
                }
                setIsRecruitModalOpen(true);
              }}
              className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-md font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all mb-4 lg:mb-0"
            >
              <UserPlus className="h-5 w-5" />
              Alistar Nuevo Recreador
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-3 w-full lg:w-auto lg:items-end">
          {isAdmin && (
            <select 
              value={selectedAdminAssociation}
              onChange={(e) => setSelectedAdminAssociation(e.target.value)}
              className="block w-full lg:w-[400px] pl-3 pr-10 py-2 border border-stone-300 rounded-md bg-stone-50 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800"
            >
              <option value="ALL">Todas las asociaciones (Selecciona una para alistar...)</option>
              {adminAssociations.map((assoc: any) => (
                <option key={assoc.id} value={assoc.id}>
                  {assoc.name || `Asociación #${assoc.id}`}
                </option>
              ))}
            </select>
          )}

          <div className="flex bg-stone-100 p-1 rounded-md border border-stone-200 w-full lg:w-[400px]">
            <button 
              onClick={() => { setFilterStatus('ACTIVE'); setCurrentPage(1); }}
              className={`flex-1 px-2 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'ACTIVE' ? 'bg-white shadow-sm text-amber-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              En Activo
            </button>
            <button 
              onClick={() => { setFilterStatus('RESERVE'); setCurrentPage(1); }}
              className={`flex-1 px-2 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'RESERVE' ? 'bg-white shadow-sm text-amber-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              En Reserva (Bajas)
            </button>
            <button 
              onClick={() => { setFilterStatus('ALL'); setCurrentPage(1); }}
              className={`flex-1 px-2 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'ALL' ? 'bg-white shadow-sm text-amber-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Histórico Total
            </button>
          </div>

          <div className="relative w-full lg:w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-md leading-5 bg-white placeholder-stone-500 focus:outline-none focus:placeholder-stone-400 focus:ring-1 focus:ring-amber-800 focus:border-amber-800 sm:text-sm transition-colors"
              placeholder="Buscar por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-700 rounded shadow-sm">
          {apiError}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Identidad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">
                  {isAdmin ? 'Regimiento / Asociación' : 'DNI/Pasaporte'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Rango</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Licencia Armas</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-stone-600 uppercase tracking-wider">Órdenes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500 font-medium">
                    Consultando los archivos del alto mando...
                  </td>
                </tr>
              ) : currentMembers.length > 0 ? (
                currentMembers.map((member, index) => {
                  const isLicenciado = !!member.endDate;

                  return (
                    <tr key={member.membershipId || member.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-stone-50'} hover:bg-stone-100 transition-colors ${isLicenciado ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold ${isLicenciado ? 'bg-stone-200 text-stone-400' : 'bg-stone-200 text-stone-600'}`}>
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
                              {member.firstName} {member.lastName}
                              {isLicenciado && <span className="bg-stone-200 text-stone-600 text-[10px] px-2 py-0.5 rounded uppercase tracking-wide">Reserva</span>}
                            </div>
                            <div className="text-sm text-stone-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700 font-medium">
                        {isAdmin ? (
                          <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs border border-stone-200 shadow-sm">
                            {member.associationName || 'Sin asignar'}
                          </span>
                        ) : (
                          member.nationalId
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isLicenciado ? 'bg-stone-100 text-stone-500' : 'bg-amber-100 text-amber-800'}`}>
                          {member.historicalRank || 'Recluta'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {member.weaponLicense ? (
                          <span className="text-stone-800 font-medium">{member.weaponLicense}</span>
                        ) : (
                          <span className="text-stone-400 italic">Sin licencia</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          
                          <button 
                            onClick={() => {
                              setSelectedMember(member);
                              setIsModalOpen(true);
                            }}
                            className="text-stone-500 hover:text-amber-800 transition-colors"
                            title="Ver Expediente"
                          >
                            <UserCog className="h-5 w-5" />
                          </button>
                          
                          {(isPresident && member.membershipId) && (
                            isLicenciado ? (
                              <button 
                                onClick={() => handleReactivar(member)}
                                className="text-amber-600 hover:text-green-600 transition-colors"
                                title="Llamar a filas (Reactivar al recreador)"
                              >
                                <RefreshCcw className="h-5 w-5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleLicenciar(member)}
                                className="text-stone-400 hover:text-red-600 transition-colors"
                                title="Licenciar / Dar de baja del Regimiento"
                              >
                                <UserMinus className="h-5 w-5" />
                              </button>
                            )
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                    No se encontraron tropas en este sector.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredMembers.length > 0 && (
          <div className="bg-stone-50 px-4 py-3 border-t border-stone-200 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-stone-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredMembers.length)}</span> de <span className="font-medium">{filteredMembers.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-stone-300 bg-white text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-stone-300 bg-white text-sm font-medium text-stone-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-stone-300 bg-white text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProfileModal 
        isOpen={isModalOpen} 
        member={selectedMember} 
        onClose={() => setIsModalOpen(false)} 
      />

      <RecruitModal 
        isOpen={isRecruitModalOpen}
        onClose={() => setIsRecruitModalOpen(false)}
        associationId={isAdmin ? Number(selectedAdminAssociation) : (managedAssociationIds[0] || 0)}
        isAdmin={isAdmin}
        onSuccess={() => {
          setIsRecruitModalOpen(false);
          fetchMembers();
        }}
      />
    </div>
  );
}