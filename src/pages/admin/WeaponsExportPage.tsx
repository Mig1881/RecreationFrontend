// src/pages/admin/WeaponsExportPage.tsx
import { useState, useEffect } from 'react';
import { membersService, type Member } from '../../services/members.service';
import { ShieldAlert, Download, FileText } from 'lucide-react';

export default function WeaponsExportPage() {
  const [armedMembers, setArmedMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArmedTroops = async () => {
      try {
        // Obtenemos todos los miembros y filtramos en cliente los que tienen licencia
        const data = await membersService.getAll();
        const filtered = data.filter(member => member.weaponLicense && member.weaponLicense.trim() !== '');
        setArmedMembers(filtered);
      } catch (error: any) {
        setApiError(error.message || 'Error al obtener los registros de armamento.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArmedTroops();
  }, []);

  // Función nativa para generar y descargar un CSV en el navegador
  const handleDownloadCSV = () => {
    if (armedMembers.length === 0) return;

    // Cabeceras del CSV
    const headers = ['DNI/Pasaporte', 'Apellidos', 'Nombre', 'Licencia de Armas', 'Rango'];
    
    // Mapeo de datos
    const rows = armedMembers.map(member => [
      member.nationalId,
      member.lastName,
      member.firstName,
      member.weaponLicense,
      member.historicalRank || 'Recluta'
    ]);

    // Construcción del contenido del archivo
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')) // Escapamos con comillas por si hay espacios
    ].join('\n');

    // Creación del Blob y forzado de descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registro_armas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 inline-flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-amber-800" />
            Intervención de Armas
          </h1>
          <p className="text-stone-500 mt-2">
            Control de licencias y exportación del censo para autoridades competentes.
          </p>
        </div>
        
        {/* Ley de Figura-Fondo: Botón de acción principal muy destacado */}
        <button
          onClick={handleDownloadCSV}
          disabled={isLoading || armedMembers.length === 0}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-5 w-5 mr-2" />
          Descargar Documento CSV
        </button>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-700 rounded shadow-sm">
          {apiError}
        </div>
      )}

      {/* Contenedor de la Tabla */}
      <div className="bg-white shadow-sm rounded-lg border border-stone-200 overflow-hidden">
        
        <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-700 font-bold">
            <FileText className="h-5 w-5 text-stone-500" />
            Efectivos con licencia activa
          </div>
          <span className="bg-stone-200 text-stone-700 py-1 px-3 rounded-full text-xs font-bold">
            {armedMembers.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Identidad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">DNI / Pasaporte</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Número de Licencia</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase tracking-wider">Rango</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-stone-500 font-medium">
                    Consultando archivos de la armería...
                  </td>
                </tr>
              ) : armedMembers.length > 0 ? (
                armedMembers.map((member, index) => (
                  <tr key={member.id} className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50 hover:bg-stone-100'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-stone-900">{member.lastName}, {member.firstName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700 font-medium">
                      {member.nationalId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                        {member.weaponLicense}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {member.historicalRank || 'Recluta'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-stone-500">
                    No hay tropas con licencias de armas registradas en el censo.
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