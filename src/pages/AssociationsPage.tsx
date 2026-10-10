// src/pages/AssociationsPage.tsx
import { useState, useEffect } from 'react';
import { associationsService, type Association } from '../services/associations.service';
import { Shield, MapPin, Users, Calendar } from 'lucide-react';

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssociations = async () => {
      try {
        const data = await associationsService.getAll();
        setAssociations(data);
      } catch (error: any) {
        setApiError(error.message || 'Error al establecer comunicación con los cuarteles generales.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssociations();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Cabecera */}
      <div>
        <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">
          Asociaciones Históricas
        </h1>
        <p className="text-stone-500 mt-2">Catálogo de regimientos y grupos de recreación adscritos al Mando Central.</p>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-700 rounded shadow-sm">
          {apiError}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-stone-500 font-medium">
          Consultando registros de los regimientos...
        </div>
      ) : associations.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          Actualmente no hay asociaciones registradas en el sistema.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {associations.map((assoc) => (
            <div 
              key={assoc.id} 
              className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="bg-stone-100 p-5 border-b border-stone-200 flex items-start gap-4">
                <div className="h-14 w-14 bg-amber-800 rounded-lg shadow-sm flex items-center justify-center text-white flex-shrink-0">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900 leading-tight">
                    {assoc.name}
                  </h3>
                  <p className="text-sm text-stone-500 font-medium mt-1">
                    CIF/Registro: {assoc.taxId || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="p-5 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-stone-600">
                    <MapPin className="h-4 w-4 text-amber-800 mt-0.5 flex-shrink-0" />
                    <span>Sede registrada en comandancia</span>
                  </div>
                  {assoc.allegiance && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <Users className="h-4 w-4 text-amber-800 flex-shrink-0" />
                      <span className="font-bold text-stone-800">{assoc.allegiance}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:border-l border-stone-100 sm:pl-4">
                  {assoc.foundationYear && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <Calendar className="h-4 w-4 text-stone-400 flex-shrink-0" />
                      <span>Fundada en <span className="font-bold text-stone-800">{assoc.foundationYear}</span></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-stone-50 p-4 border-t border-stone-200">
                <p className="text-sm text-stone-500 italic text-center">
                  El ingreso en este regimiento requiere aprobación de su Junta Directiva. 
                  Contacte con la presidencia para solicitar su alta formal.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}