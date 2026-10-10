// src/pages/admin/AdminAssociationsPage.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { associationsService, type Association } from '../../services/associations.service';
import { Shield, Edit, Trash2, Plus, X } from 'lucide-react';

export default function AdminAssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset } = useForm<Association>();

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
      reset({ taxId: '', name: '', foundationYear: new Date().getFullYear(), allegiance: '', historicalAttire: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
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
                <td className="px-6 py-4 flex items-center gap-3"><Shield className="h-5 w-5 text-amber-800" /> <span className="font-bold">{assoc.name}</span></td>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-amber-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold">{editingId ? 'Modificar Expediente' : 'Alta de Nuevo Regimiento'}</h3>
              <button onClick={closeModal} className="text-amber-200 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-1">Nombre</label><input type="text" className="w-full px-3 py-2 border rounded" {...register('name', { required: true })} /></div>
                <div><label className="block text-sm font-bold text-stone-700 mb-1">CIF</label><input type="text" className="w-full px-3 py-2 border rounded" {...register('taxId', { required: true })} /></div>
                <div><label className="block text-sm font-bold text-stone-700 mb-1">Año Fundación</label><input type="number" className="w-full px-3 py-2 border rounded" {...register('foundationYear', { valueAsNumber: true })} /></div>
                <div><label className="block text-sm font-bold text-stone-700 mb-1">Bando</label><input type="text" className="w-full px-3 py-2 border rounded" {...register('allegiance')} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-bold text-stone-700 mb-1">Descripción Uniforme</label><textarea className="w-full px-3 py-2 border rounded" {...register('historicalAttire')} /></div>
              </div>
              <div className="mt-6 border-t pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 font-bold text-stone-600">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-amber-800 text-white font-bold rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}