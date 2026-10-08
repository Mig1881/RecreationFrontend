// src/pages/HomePage.tsx
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { state } = useAuth();
  const { user } = state;

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-800 mb-6 border-b border-stone-200 pb-4">
        Resumen Operativo
      </h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold text-amber-900 mb-2">
          Bienvenido a las filas, Recreador.
        </h2>
        <p className="text-stone-600 text-lg">
          Tu nivel de acceso actual te permite operar como: <span className="font-bold text-stone-800">{user?.roles.join(', ')}</span>.
        </p>
        <p className="mt-4 text-stone-500">
          Desde aquí podrás gestionar tus inscripciones a los próximos eventos históricos, consultar tu asociación y registrar el armamento que portarás en cada campaña.
        </p>
      </div>
    </div>
  );
}