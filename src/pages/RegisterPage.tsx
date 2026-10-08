// src/pages/RegisterPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { authService, type SignupDto } from '../services/auth.service';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupDto>();

  const onSubmit = async (data: SignupDto) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      // Llamada al endpoint de registro público
      const responseMessage = await authService.register(data);
      setSuccessMessage(responseMessage || '¡Recreador registrado con éxito!');
      
      // Opcional: Redirigir automáticamente tras 3 segundos
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);

    } catch (error: any) {
      setApiError(error.message || 'Error al registrar el usuario. Revisa los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4 py-8">
      {/* Contenedor principal: Ley de Cierre */}
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-lg border border-stone-200">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl text-amber-900 mb-2" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Alistamiento
          </h1>
          <p className="text-stone-500 font-medium text-sm uppercase tracking-widest">
            Nuevo Recreador Histórico
          </p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded text-sm font-medium">
            {apiError}
          </div>
        )}

        {successMessage ? (
          <div className="text-center py-8">
            <div className="mb-4 text-green-700 text-6xl">✓</div>
            <h2 className="text-2xl font-bold text-stone-800 mb-4">{successMessage}</h2>
            <p className="text-stone-600 mb-6">Serás redirigido al Mando Central en breves instantes...</p>
            <Link to="/login" className="text-amber-800 font-bold hover:underline">
              Ir al inicio de sesión ahora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* GRUPO 1: Datos Personales (Ley de Proximidad) */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">
                Identidad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-md border border-stone-300 focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    {...register('firstName', { required: 'El nombre es obligatorio' })}
                  />
                  {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-md border border-stone-300 focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    {...register('lastName', { required: 'Los apellidos son obligatorios' })}
                  />
                  {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">DNI / Pasaporte</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-md border border-stone-300 focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    {...register('nationalId', { required: 'El documento es obligatorio' })}
                  />
                  {errors.nationalId && <p className="text-red-600 text-xs mt-1">{errors.nationalId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded-md border border-stone-300 focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    {...register('birthDate')}
                  />
                </div>
              </div>
            </div>

            {/* GRUPO 2: Contacto y Seguridad */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">
                Contacto y Acceso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-md border border-stone-300 focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    {...register('email', { required: 'El correo es obligatorio' })}
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 rounded-md border border-stone-300 focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    {...register('phone')}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-md border border-stone-300 focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    {...register('password', { required: 'La contraseña es obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                  />
                  {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-900 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Procesando...' : 'Solicitar Alistamiento'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center border-t border-stone-200 pt-6">
          <p className="text-sm text-stone-600">
            ¿Ya estás en nuestras filas?{' '}
            <Link to="/login" className="font-bold text-amber-800 hover:text-amber-900 underline decoration-amber-300 decoration-2 underline-offset-4">
              Volver al Mando Central
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}