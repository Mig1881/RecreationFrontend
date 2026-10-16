// src/components/members/RecruitModal.tsx
import { useState } from 'react';
import { membersService } from '../../services/members.service';
import { membershipsService } from '../../services/memberships.service';
import { X, UserPlus, ShieldAlert, CheckCircle, Search, UserCheck } from 'lucide-react';

interface RecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  associationId: number;
  isAdmin?: boolean;
}

export default function RecruitModal({ isOpen, onClose, onSuccess, associationId, isAdmin }: RecruitModalProps) {

  const [activeTab, setActiveTab] = useState<'NEW' | 'VETERAN'>('NEW');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para el Recluta Nuevo
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    email: '',
    password: '', 
    phone: '',
    historicalRank: 'Recluta',
    weaponLicense: '',
    role: 'member'
  });

  // Estado para el Veterano Existente
  const [veteranDni, setVeteranDni] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- FLUJO 1: NUEVO RECLUTA (Crear Member + Crear Membership) ---
  const handleNewRecruitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const newMember = await membersService.create(formData);
      await membershipsService.enroll({
        associationId: associationId,
        memberId: newMember.id
      });
      onSuccess();
    } catch (err: any) {
      // Interceptamos el error 409 de duplicidad
      const errorMessage = err.message?.toLowerCase() || "";
      const isConflict = errorMessage.includes('campo único') || 
                         errorMessage.includes('ya exista') || 
                         errorMessage.includes('integridad de datos');

      if (isConflict) {
        setError('Este DNI o Correo ya existe en la base de datos. Por favor, selecciona la pestaña "Vincular Veterano" para reclutarlo usando su DNI.');
      } else {
        setError(err.message || 'Error al procesar el alistamiento. Comprueba los datos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FLUJO 2: VETERANO EXISTENTE (Solo Crear Membership) ---
  const handleVeteranSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Obtenemos todos los miembros (ya que no tenemos findByDni en el backend)
      const allMembers = await membersService.getAll();
      
      // 2. Buscamos el DNI exacto ignorando mayúsculas/minúsculas
      const targetMember = allMembers.find((m: any) => m.nationalId.toUpperCase() === veteranDni.trim().toUpperCase());

      if (!targetMember) {
        throw new Error("No consta ningún recreador con este DNI en los archivos del Cuartel General.");
      }

      // 3. Lo vinculamos directamente a la asociación del presidente
      await membershipsService.enroll({
        associationId: associationId,
        memberId: targetMember.id
      });
      
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.message?.toLowerCase() || "";
      // Capturamos si ya está metido en esta misma asociación
      if (errorMessage.includes('ya existe') || errorMessage.includes('duplicada') || errorMessage.includes('conflict')) {
        setError('Este veterano ya está adscrito a tu regimiento actualmente.');
      } else {
        setError(err.message || 'Error de comunicación al tramitar la adscripción.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="bg-green-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Gestión de Alistamientos
          </h3>
          <button onClick={onClose} className="text-green-200 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 🔥 PESTAÑAS DE NAVEGACIÓN 🔥 */}
        <div className="flex border-b border-stone-200 bg-stone-50 shrink-0">
          <button 
            onClick={() => { setActiveTab('NEW'); setError(null); }}
            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'NEW' ? 'border-green-700 text-green-800 bg-white' : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-100'}`}
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Ingreso (Registro Completo)
          </button>
          <button 
            onClick={() => { setActiveTab('VETERAN'); setError(null); }}
            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'VETERAN' ? 'border-amber-700 text-amber-800 bg-white' : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-100'}`}
          >
            <Search className="h-4 w-4" />
            Vincular Veterano (Ya registrado)
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 border-l-4 border-red-700 rounded shadow-sm flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* ========================================== */}
          {/* VISTA 1: FORMULARIO DE NUEVO RECLUTA       */}
          {/* ========================================== */}
          {activeTab === 'NEW' && (
            <form id="newRecruitForm" onSubmit={handleNewRecruitSubmit} className="space-y-6">
              <div className="border-b border-stone-200 pb-4">
                <h4 className="text-lg font-bold text-amber-900 mb-4">Datos Personales Obligatorios</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-bold text-stone-700 mb-1">Nombre</label>
                    <input id="firstName" type="text" name="firstName" required value={formData.firstName} onChange={handleChange}
                      className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-bold text-stone-700 mb-1">Apellidos</label>
                    <input id="lastName" type="text" name="lastName" required value={formData.lastName} onChange={handleChange}
                      className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                  </div>
                  <div>
                    <label htmlFor="nationalId" className="block text-sm font-bold text-stone-700 mb-1">DNI / Pasaporte</label>
                    <input id="nationalId" type="text" name="nationalId" required value={formData.nationalId} onChange={handleChange}
                      className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-bold text-stone-700 mb-1">Teléfono</label>
                    <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                  </div>
                </div>
              </div>

              <div className="border-b border-stone-200 pb-4">
                <h4 className="text-lg font-bold text-amber-900 mb-4">Credenciales de Acceso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-stone-700 mb-1">Correo Electrónico</label>
                    <input id="email" type="email" name="email" required value={formData.email} onChange={handleChange}
                      className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-bold text-stone-700 mb-1">Contraseña Provisional</label>
                    <input id="password" type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Ej: 12345678"
                      className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-amber-900 mb-4">Datos Militares (Opcional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Rango Histórico Inicial</label>
                    <input type="text" name="historicalRank" value={formData.historicalRank} onChange={handleChange} placeholder="Ej: Soldado, Recluta, Tambor..."
                      className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Licencia de Armas</label>
                    <input type="text" name="weaponLicense" value={formData.weaponLicense} onChange={handleChange} placeholder="Ej: Tipo AE"
                      className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="border-t border-stone-200 pt-4 mt-6">
                  <h4 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-900" />
                    Privilegios de Sistema (Solo Administración)
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Nivel de Acceso en la Plataforma</label>
                      <select name="role" value={formData.role} onChange={handleChange}
                        className="w-full px-3 py-2 border border-red-300 bg-red-50 text-red-900 rounded focus:ring-2 focus:ring-red-700 font-medium outline-none">
                        <option value="member">Tropa / Recreador Estándar</option>
                        <option value="president">Presidente de Asociación</option>
                      </select>
                      <p className="text-xs text-red-600 mt-1">Cuidado: Asignar el rol de Presidente otorgará control total sobre el regimiento seleccionado.</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* ========================================== */}
          {/* VISTA 2: FORMULARIO DE VETERANO (Solo DNI) */}
          {/* ========================================== */}
          {activeTab === 'VETERAN' && (
            <form id="veteranRecruitForm" onSubmit={handleVeteranSubmit} className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                <h4 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Identificación de Veterano
                </h4>
                <p className="text-stone-600 text-sm mb-5">
                  Introduce el DNI del recreador que ya tiene cuenta en la plataforma. Al aprobar, quedará adscrito automáticamente a las filas de tu regimiento.
                </p>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">DNI / Pasaporte del Recreador</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-stone-400" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={veteranDni} 
                      onChange={(e) => setVeteranDni(e.target.value)}
                      placeholder="Ej: 12345678Z"
                      className="w-full pl-10 pr-3 py-3 border border-stone-300 rounded shadow-sm focus:ring-2 focus:ring-amber-700 focus:border-amber-700 bg-white font-medium" 
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

        </div>

        {/* Botonera inferior dinámica */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="px-5 py-2 text-stone-600 font-bold hover:bg-stone-200 rounded transition-colors disabled:opacity-50">
            Cancelar
          </button>
          
          <button 
            type="submit" 
            form={activeTab === 'NEW' ? "newRecruitForm" : "veteranRecruitForm"} 
            disabled={isSubmitting}
            className={`px-6 py-2 text-white font-bold rounded shadow-md transition-colors disabled:opacity-50 flex items-center gap-2 ${activeTab === 'NEW' ? 'bg-green-700 hover:bg-green-800' : 'bg-amber-700 hover:bg-amber-800'}`}
          >
            {isSubmitting ? 'Tramitando...' : (
              <>
                <CheckCircle className="h-5 w-5" />
                {activeTab === 'NEW' ? 'Aprobar Alistamiento' : 'Vincular a mi Regimiento'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}