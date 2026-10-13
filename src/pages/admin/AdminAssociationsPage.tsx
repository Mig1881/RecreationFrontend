// src/pages/admin/AdminAssociationsPage.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { associationsService, type Association } from '../../services/associations.service';
import { Shield, Edit, Trash2, Plus, X, UploadCloud } from 'lucide-react';

export default function AdminAssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Association>();
  
  const currentLogo = watch('logoBase64');

  const loadAssociations = async () => {
    try {
      const data = await associationsService.getAll();
      setAssociations(data);
    } catch (error: any) {
      setFeedback({ type: 'error', text: 'Error al cargar los regimientos.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAssociations(); }, []);

  const openModal = (association?: Association) => {
    setFeedback(null);
    if (association) {
      setEditingId(association.id!);
      reset(association);
    } else {
      setEditingId(null);
      reset({ taxId: '', name: '', city: '', foundationYear: new Date().getFullYear(), allegiance: '', historicalAttire: '', logoBase64: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("El escudo es demasiado pesado. El tamaño máximo es 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('logoBase64', reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: Association) => {
    setFeedback(null);
    try {
      if (editingId) {
        await associationsService.update(editingId, data);
        setFeedback({ type: 'success', text: 'Asociación actualizada con éxito.' });
      } else {
        await associationsService.create(data);
        setFeedback({ type: 'success', text: 'Nueva asociación registrada en el Mando Central.' });
      }
      closeModal();
      loadAssociations();
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Error al guardar la asociación.' });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Estás seguro de disolver el regimiento "${name}"?`)) return;
    try {
      await associationsService.delete(id);
      setFeedback({ type: 'success', text: 'Asociación eliminada de los registros.' });
      loadAssociations();
    } catch (error: any) {
      setFeedback({ type: 'error', text: 'No se puede eliminar. Es posible que tenga tropas asignadas.' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 border-b-2 border-amber-800 pb-2 inline-block">Gestión de Asociaciones</h1>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white font-bold rounded-md hover:bg-amber-900">
          <Plus className="h-5 w-5" /> Registrar Asociación
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-md border-l-4 shadow-sm text-sm font-medium ${feedback.type === 'success' ? 'bg-green-50 border-green-700 text-green-800' : 'bg-red-50 border-red-700 text-red-800'}`}>
          {feedback.text}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-stone-200 overflow-hidden">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase">Regimiento</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase">CIF</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 uppercase">Bando</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-stone-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-200">
            {isLoading ? <tr><td colSpan={4} className="p-6 text-center text-stone-500">Cargando...</td></tr> : 
              associations.map((assoc, index) => (
              <tr key={assoc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                <td className="px-6 py-4 flex items-center gap-3">
                  {assoc.logoBase64 ? (
                    <img src={assoc.logoBase64} alt="Escudo" className="h-8 w-8 object-cover rounded-md border border-stone-200" />
                  ) : (
                    <Shield className="h-6 w-6 text-stone-400" /> 
                  )}
                  <span className="font-bold">{assoc.name}</span>
                </td>
                <td className="px-6 py-4 text-sm">{assoc.taxId}</td>
                <td className="px-6 py-4 text-sm">{assoc.allegiance}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => openModal(assoc)} className="text-amber-600 hover:text-amber-900"><Edit className="h-5 w-5 inline" /></button>
                  <button onClick={() => handleDelete(assoc.id!, assoc.name)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold">{editingId ? 'Modificar Expediente' : 'Alta de Nuevo Regimiento'}</h3>
              <button onClick={closeModal} className="text-amber-200 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="flex flex-col sm:flex-row gap-6 items-center p-4 bg-stone-50 border border-stone-200 rounded-lg mb-4">
                <div className="h-24 w-24 bg-white border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                  {currentLogo ? (
                    <>
                      <img src={currentLogo} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setValue('logoBase64', '')} className="text-white text-xs font-bold hover:text-red-400">Quitar</button>
                      </div>
                    </>
                  ) : (
                    <Shield className="h-10 w-10 text-stone-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Escudo / Emblema (Opcional)</label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-md shadow-sm cursor-pointer hover:bg-stone-50 text-sm font-medium text-stone-700 w-fit transition-colors">
                    <UploadCloud className="h-4 w-4" />
                    Seleccionar Archivo
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-stone-500 mt-2">Formatos aceptados: JPG, PNG. Tamaño máximo 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-1">Nombre Oficial</label>
                  <input type="text" className="w-full px-3 py-2 border rounded" {...register('name', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">CIF</label>
                  <input type="text" className="w-full px-3 py-2 border rounded" {...register('taxId', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Año Fundación</label>
                  <input type="number" className="w-full px-3 py-2 border rounded" {...register('foundationYear', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Bando Histórico</label>
                  <input type="text" placeholder="Ej: Ejército Francés" className="w-full px-3 py-2 border rounded" {...register('allegiance')} />
                </div>
                
                {/* AÑADO EL INPUT DE LA CIUDAD SEDE EN EL FORMULARIO */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Ciudad Sede</label>
                  <input type="text" placeholder="Ej: Zaragoza" className="w-full px-3 py-2 border rounded" {...register('city')} />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-1">Descripción Uniforme</label>
                  <textarea rows={3} className="w-full px-3 py-2 border rounded" {...register('historicalAttire')} />
                </div>
              </div>

              <div className="mt-6 border-t pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 font-bold text-stone-600">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-amber-800 text-white font-bold rounded shadow hover:bg-amber-900">Guardar Expediente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}