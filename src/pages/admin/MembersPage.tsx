// src/pages/admin/MembersPage.tsx
import { useState, useEffect } from 'react';
import { membersService, type Member } from '../../services/members.service';
import { Search, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await membersService.getAll();
        setMembers(data);
      } catch (error: any) {
        setApiError(error.message || 'Error al obtener el listado de tropas.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Filtrado reactivo en el cliente
  const filteredMembers = members.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.nationalId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos de Paginación
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Cabecera y Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">
            Registro de Recreadores
          </h1>
          <p className="text-stone-500 mt-2">Gestión del censo oficial de la asociación.</p>
        </div>
        
        <div className="relative w-full md:w-72">
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
              setCurrentPage(1); // Resetear a la primera página al buscar
            }}
          />
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-700 rounded shadow-sm">
          {apiError}
        </div>
      )}

      {/* Contenedor de la Tabla (Ley de Cierre) */}
      <div className="bg-white shadow-sm rounded-lg border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Identidad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">DNI/Pasaporte</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Rango</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Licencia Armas</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-stone-600 uppercase tracking-wider">Acciones</th>
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
                currentMembers.map((member, index) => (
                  // Cebreado para facilitar la lectura horizontal (Ley de Continuidad)
                  <tr key={member.id} className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50 hover:bg-stone-100'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-stone-200 rounded-full flex items-center justify-center text-stone-500">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-stone-900">{member.firstName} {member.lastName}</div>
                          <div className="text-sm text-stone-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700 font-medium">
                      {member.nationalId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
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
                      <button className="text-amber-800 hover:text-amber-900 transition-colors flex items-center justify-end w-full">
                        <UserCog className="h-5 w-5 mr-1" />
                        Perfil
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                    No se encontraron tropas con esos criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!isLoading && filteredMembers.length > 0 && (
          <div className="bg-stone-50 px-4 py-3 border-t border-stone-200 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-stone-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredMembers.length)}</span> de <span className="font-medium">{filteredMembers.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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
    </div>
  );
}