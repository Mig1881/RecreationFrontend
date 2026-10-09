// src/components/layout/ProfileModal.tsx
import { X, Shield, Mail, Calendar } from 'lucide-react';
import type { Member } from '../../services/members.service';

interface ProfileModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ member, isOpen, onClose }: ProfileModalProps) {
  // Si no está abierto o no hay miembro, no renderizamos nada
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200">
        
        <div className="bg-amber-900 px-6 py-4 flex justify-between items-center text-stone-50">
          <h3 className="text-xl font-bold" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Expediente del Recreador
          </h3>
          <button onClick={onClose} className="text-stone-300 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4 border-b border-stone-200 pb-6">
            <div className="h-16 w-16 bg-stone-300 rounded-full flex items-center justify-center text-stone-600 text-xl font-bold border-2 border-amber-800">
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </div>
            <div>
              <h4 className="text-2xl font-bold text-stone-800">{member.firstName} {member.lastName}</h4>
              <p className="text-stone-500 font-medium">DNI: {member.nationalId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-amber-800 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Contacto</p>
                <p className="text-stone-700 font-medium">{member.email}</p>
                {member.phone && <p className="text-stone-700">{member.phone}</p>}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-800 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Rango y Licencias</p>
                <p className="text-stone-700 font-medium">{member.historicalRank || 'Recluta Base'}</p>
                <p className="text-stone-600 text-sm">Armas: {member.weaponLicense || 'Ninguna'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-amber-800 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Alistamiento</p>
                <p className="text-stone-700 font-medium">
                  {member.enrollmentDate ? new Date(member.enrollmentDate).toLocaleDateString() : 'Desconocido'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-stone-200 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-stone-300 rounded-md shadow-sm text-sm font-bold text-stone-700 hover:bg-stone-50">
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
}