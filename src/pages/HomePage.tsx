// src/pages/HomePage.tsx
import { useAuth } from '../context/AuthContext';
import { Shield, Calendar, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import jacaHero from '../assets/jaca_recreation.jpg';

export default function HomePage() {
  const { state } = useAuth();
  const { user } = state;

  // LÓGICA DE VISUALIZACIÓN: 
  const displayName = user?.email 
    ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)
    : 'Oficial';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-stone-300 h-64 md:h-80 w-full group bg-stone-100">
        <img 
          src={jacaHero} 
          alt="Recreación en Jaca" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 bg-amber-800 text-white text-xs font-bold uppercase tracking-wider rounded mb-3 shadow">
              Mando Central
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-md">
              Bienvenido, {displayName}
            </h1>
            <p className="text-amber-400 font-medium tracking-wide text-sm md:text-base drop-shadow">
              Plataforma de despliegue y gestión de la Asociación Napoleónica Española.
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de Acceso Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-stone-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">Próximas Campañas</h3>
          <p className="text-stone-500 text-sm mb-4">Consulta el calendario oficial de eventos, batallas y maniobras programadas.</p>
          <Link to="/events" className="text-amber-800 font-bold text-sm hover:text-amber-900 flex items-center gap-1">
            Ver calendario <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-stone-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">Regimientos</h3>
          <p className="text-stone-500 text-sm mb-4">Accede al catálogo de asociaciones históricas adscritas a nuestra comandancia.</p>
          <Link to="/associations" className="text-amber-800 font-bold text-sm hover:text-amber-900 flex items-center gap-1">
            Ver regimientos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-stone-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">Mi Expediente</h3>
          <p className="text-stone-500 text-sm mb-4">Revisa tu hoja de servicios, rango histórico y licencias de armas registradas.</p>
          <Link to="/profile" className="text-amber-800 font-bold text-sm hover:text-amber-900 flex items-center gap-1">
            Ir a mi perfil <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}