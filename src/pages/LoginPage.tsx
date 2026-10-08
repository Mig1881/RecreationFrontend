// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, type LoginDto } from '../services/auth.service';

export default function LoginPage() {
  const navigate = useNavigate();
  const { dispatch } = useAuth();
  
  // Estado local para manejar el spinner y mensajes de error de la API
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Inicialización de React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm<LoginDto>();

  // Función que se ejecuta al enviar el formulario válido
  const onSubmit = async (data: LoginDto) => {
    setIsLoading(true);
    setApiError(null);

    try {
      // Llamada al endpoint público /api/auth/login
      const response = await authService.login(data);
      
      // Si el servidor responde con 200 OK, guardamos la sesión
      dispatch({
        type: 'LOGIN',
        payload: {
          token: response.token,
          user: {
            id: response.id,
            email: response.email,
            roles: response.roles
          }
        }
      });

      // Redirección al Dashboard
      navigate('/', { replace: true });

    } catch (error: any) {
      // Capturamos el ErrorResponse tipado de nuestro apiClient
      setApiError(error.message || 'Error al verificar las credenciales. Revisa tus datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      {/* Tarjeta del Formulario (Ley de Cierre y Figura-Fondo) */}
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-stone-200">
        
        {/* Cabecera y Tipografía solemne */}
        <div className="text-center mb-8">
          <h1 
            className="text-4xl text-amber-900 mb-2" 
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            Mando Central
          </h1>
          <p className="text-stone-500 font-medium text-sm uppercase tracking-widest">
            Asociación de Recreación Histórica
          </p>
        </div>

        {/* Notificación de Error */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded text-sm font-medium">
            {apiError}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Grupo: Correo Electrónico (Ley de Proximidad) */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`w-full px-4 py-3 rounded-md border bg-stone-50 text-stone-900 text-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-stone-300'
              }`}
              {...register('email', { 
                required: 'El correo electrónico es obligatorio',
                pattern: { value: /^\S+@\S+$/i, message: 'Formato de correo inválido' }
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Grupo: Contraseña (Ley de Proximidad y Similitud) */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`w-full px-4 py-3 rounded-md border bg-stone-50 text-stone-900 text-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent transition-colors ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'border-stone-300'
              }`}
              {...register('password', { required: 'La contraseña es obligatoria' })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Botón de Acción Principal */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verificando...' : 'Entrar a la Base'}
            </button>
          </div>
        </form>

        {/* Enlace secundario */}
        <div className="mt-8 text-center border-t border-stone-200 pt-6">
          <p className="text-sm text-stone-600">
            ¿Aún no estás alistado?{' '}
            <a href="/register" className="font-bold text-amber-800 hover:text-amber-900 underline decoration-amber-300 decoration-2 underline-offset-4">
              Solicitar ingreso
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}