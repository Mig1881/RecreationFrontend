// src/components/members/RecruitModal.tsx
import { useState } from 'react';
import { membersService } from '../../services/members.service';
import { membershipsService } from '../../services/memberships.service';
import { X, UserPlus, ShieldAlert, CheckCircle } from 'lucide-react';

interface RecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  associationId: number; // Necesitamos saber a qué regimiento va
}

export default function RecruitModal({ isOpen, onClose, onSuccess, associationId }: RecruitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    email: '',
    password: '', // El presidente le asigna una clave inicial
    phone: '',
    historicalRank: 'Recluta',
    weaponLicense: '',
    role: 'member' // Por defecto, creamos tropas rasas
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Damos de alta al soldado en el sistema general
      const newMember = await membersService.create(formData);

      // 2. Lo adscribimos automáticamente al regimiento del Presidente
      await membershipsService.enroll({
        associationId: associationId,
        memberId: newMember.id
      });

      // 3. Limpiamos y avisamos a la página para que recargue la tabla
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el alistamiento. Comprueba que el DNI o Email no existan ya.');
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
            Expediente de Nuevo Ingreso
          </h3>
          <button onClick={onClose} className="text-green-200 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cuerpo con Scroll (Por si en móviles se ve pequeño) */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 border-l-4 border-red-700 rounded shadow-sm flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form id="recruitForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="border-b border-stone-200 pb-4">
              <h4 className="text-lg font-bold text-amber-900 mb-4">Datos Personales Obligatorios</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Nombre</label>
                  <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Apellidos</label>
                  <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">DNI / Pasaporte</label>
                  <input type="text" name="nationalId" required value={formData.nationalId} onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Teléfono</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                </div>
              </div>
            </div>

            <div className="border-b border-stone-200 pb-4">
              <h4 className="text-lg font-bold text-amber-900 mb-4">Credenciales de Acceso</h4>
              <p className="text-xs text-stone-500 mb-3">Establece el acceso inicial para que el soldado pueda entrar a la intranet.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Correo Electrónico</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-green-700 focus:border-green-700 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Contraseña Provisional</label>
                  <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Ej: 12345678"
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

          </form>
        </div>

        {/* Botonera inferior */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="px-5 py-2 text-stone-600 font-bold hover:bg-stone-200 rounded transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="recruitForm" disabled={isSubmitting}
            className="px-6 py-2 bg-green-700 text-white font-bold rounded shadow-md hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? 'Tramitando Expediente...' : (
              <>
                <CheckCircle className="h-5 w-5" />
                Aprobar Alistamiento
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}