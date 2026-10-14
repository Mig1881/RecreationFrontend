// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, type LoginDto } from '../services/auth.service';
import escudoLogo from '../assets/ANE.png'; 
import battleBackground from '../assets/batalla.jpg'; 

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
    <div className="flex min-h-screen bg-stone-50">
      
      {/* ========================================== */}
      {/* MITAD IZQUIERDA: Formulario de Acceso      */}
      {/* ========================================== */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center items-center p-8 sm:p-12 xl:p-24 shadow-2xl z-10 bg-white relative">
        
        <div className="w-full max-w-sm mx-auto space-y-8">
          
          {/* Cabecera con Escudo y Tipografía solemne */}
          <div className="text-center flex flex-col items-center">
            <img 
              src={escudoLogo} 
              alt="Escudo Oficial ANE" 
              className="h-28 w-auto mb-6 object-contain drop-shadow-md"
            />
            <h1 
              className="text-4xl text-amber-900 mb-2" 
              style={{ fontFamily: "'Cinzel Decorative', serif" }}
            >
              Mando Central
            </h1>
            <p className="text-stone-500 font-medium text-sm uppercase tracking-widest mt-2">
              Asociación de Recreación Histórica
            </p>
          </div>

          {/* Notificación de Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded text-sm font-medium animate-in fade-in">
              {apiError}
            </div>
          )}

          {/* Formulario mantenido con React Hook Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Grupo: Correo Electrónico */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="recreador@regimiento.es"
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

            {/* Grupo: Contraseña */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
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
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-lg font-bold text-white bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
              >
                {isLoading ? 'Verificando...' : 'Entrar a la Base'}
              </button>
            </div>
          </form>

          {/* Pie del formulario */}
          <div className="pt-8 text-center text-xs text-stone-400 border-t border-stone-200">
            <p>Acceso restringido. Uso exclusivo para mandos oficiales y tropas adscritas al registro general.</p>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MITAD DERECHA: Imagen Épica de Fondo       */}
      {/* ========================================== */}
      <div className="hidden lg:block relative w-full lg:w-7/12 bg-stone-900">
        
        {/* Filtros oscuros para darle tono cinematográfico y mejor legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/40 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-amber-900/20 mix-blend-multiply z-10 pointer-events-none"></div>
        
        <img
          src={battleBackground}
          alt="Recreación Histórica"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />
        
        {/* Marca de agua / Slogan decorativo */}
        <div className="absolute bottom-10 right-10 z-20 text-right">
          <p className="text-white/80 text-lg font-medium tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Honor y Lealtad
          </p>
          <p className="text-white/50 text-sm tracking-wider uppercase mt-1">
            Defendiendo la historia viva
          </p>
        </div>
      </div>

    </div>
  );
}