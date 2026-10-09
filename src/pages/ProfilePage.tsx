// src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { membersService, type Member } from '../services/members.service';
import { cloudinaryService } from '../services/cloudinary.service';
import { Camera, User } from 'lucide-react';

export default function ProfilePage() {
  const { state } = useAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hemos centralizado TODO el estado aquí
  const { register, handleSubmit, reset, setValue, watch } = useForm<Member>();

  // Observamos los campos para actualizar la tarjeta visual en tiempo real
  const currentImageUrl = watch('imageUrl');
  const currentFirstName = watch('firstName');
  const currentLastName = watch('lastName');
  const currentRank = watch('historicalRank');

  // Cargar los datos del recreador logueado
  useEffect(() => {
    if (state.user?.id) {
      membersService.getById(state.user.id)
        .then(data => {
          reset(data); // Inyecta todos los datos en el formulario central
        })
        .catch(() => setFeedbackMessage({ type: 'error', text: 'No se pudieron cargar tus datos.' }))
        .finally(() => setIsPageLoading(false));
    }
  }, [state.user?.id, reset]);

  // Manejador del cambio de archivo (Foto)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setFeedbackMessage(null);

    try {
      // 1. Subida directa a Cloudinary
      const uploadedUrl = await cloudinaryService.uploadAvatar(files[0]);
      
      // 2. Inyectamos la URL en el formulario (como un campo más)
      setValue('imageUrl', uploadedUrl, { shouldDirty: true });
      
      setFeedbackMessage({ type: 'success', text: 'Fotografía procesada. Haz clic en "Guardar Historial" para confirmar los cambios.' });
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: error.message || 'Fallo al procesar la imagen.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Guardar cambios del formulario completo (Texto + URL de la foto)
  const onSubmitForm = async (formData: Member) => {
    setFeedbackMessage(null);
    try {
      // Ahora formData contiene absolutamente todo, foto incluida
      await membersService.update(formData.id, formData);
      setFeedbackMessage({ type: 'success', text: 'Expediente y fotografía actualizados con éxito en el Mando Central.' });
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: error.message || 'Error al guardar los datos.' });
    }
  };

  if (isPageLoading) {
    return <div className="text-center py-12 text-stone-500 font-medium">Abriendo el archivo de personal...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">
          Mi Perfil de Recreador
        </h1>
        <p className="text-stone-500 mt-2">Gestiona tu identidad digital y tu fotografía para los listados oficiales.</p>
      </div>

      {feedbackMessage && (
        <div className={`p-4 rounded-md border-l-4 shadow-sm text-sm font-medium ${
          feedbackMessage.type === 'success' ? 'bg-green-50 border-green-700 text-green-800' : 'bg-red-50 border-red-700 text-red-800'
        }`}>
          {feedbackMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PANEL IZQUIERDO: Gestión de Foto */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative group">
            {/* Usamos el estado del formulario (watch) para previsualizar al instante */}
            {currentImageUrl ? (
              <img 
                src={currentImageUrl} 
                alt="Avatar" 
                className="h-36 w-36 object-cover rounded-full border-4 border-amber-800 shadow-md"
              />
            ) : (
              <div className="h-36 w-36 bg-stone-200 rounded-full flex items-center justify-center text-stone-400 border-4 border-dashed border-stone-300">
                <User className="h-16 w-16" />
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 bg-amber-800 hover:bg-amber-900 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-colors">
              <Camera className="h-5 w-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploading} />
            </label>
          </div>

          <h3 className="mt-4 text-xl font-bold text-stone-900">{currentFirstName} {currentLastName}</h3>
          <p className="text-sm font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full mt-1">
            {currentRank || 'Recluta'}
          </p>
          <p className="text-xs text-stone-400 mt-4 uppercase font-bold tracking-wider">
            {isUploading ? 'Procesando imagen...' : 'Haz click en la cámara para subir'}
          </p>
        </div>

        {/* PANEL DERECHO: Formulario de Datos */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="md:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Nombre</label>
              <input type="text" className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50" {...register('firstName', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Apellidos</label>
              <input type="text" className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50" {...register('lastName', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">DNI / Pasaporte</label>
              <input type="text" className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50" {...register('nationalId', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Teléfono de Campaña</label>
              <input type="tel" className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50" {...register('phone')} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-stone-700 mb-1">Licencia de Armas de Avancarga / Fuego</label>
              <input type="text" className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 placeholder-stone-400" placeholder="Ej: AE-123456" {...register('weaponLicense')} />
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4 flex justify-end">
            <button type="submit" className="px-6 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-md shadow transition-colors">
              Guardar Historial
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}