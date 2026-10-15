// src/components/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BarChart3 } from 'lucide-react'; 

export default function Sidebar() {
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();
  const { user } = state;

  const hasElevatedPrivileges = user?.roles.some(role => 
    ['ADMIN', 'PRESIDENT', 'ROLE_ADMIN', 'ROLE_PRESIDENT'].includes(role)
  );

  const isAdmin = user?.roles.some(role => 
    ['ADMIN', 'ROLE_ADMIN'].includes(role)
  );

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-6 py-3 text-lg font-medium transition-colors ${
      isActive
        ? 'bg-amber-100 text-amber-900 border-r-4 border-amber-800'
        : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900'
    }`;

  return (
    <aside className="w-72 bg-stone-100 border-r border-stone-200 flex flex-col min-h-screen">
      <div className="p-6 border-b border-stone-200">
        <h2 
          className="text-2xl text-amber-900 text-center" 
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          Mando Central
        </h2>
        <p className="text-xs text-center text-stone-500 uppercase tracking-widest mt-1">
          {user?.email}
        </p>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        <NavLink to="/" className={navLinkClass} end>
          Inicio
        </NavLink>
        
        <NavLink to="/dashboard" className={navLinkClass}>
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas
          </span>
        </NavLink>
        
        <NavLink to="/profile" className={navLinkClass}>
          Mi Perfil
        </NavLink>

        {/* 🔥 LÓGICA DE NEGOCIO: Ocultamos "Mis Despliegues" si el usuario es Admin 🔥 */}
        {!isAdmin && (
          <NavLink to="/my-deployments" className={navLinkClass}>
            Mis Despliegues
          </NavLink>
        )}

        <NavLink to="/associations" className={navLinkClass}>
          Asociaciones
        </NavLink>

        <NavLink to="/events" className={navLinkClass}>
          Campañas y Eventos
        </NavLink>

        {hasElevatedPrivileges && (
          <div className="pt-6 mt-6 border-t border-stone-200">
            <p className="px-6 text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              Gestión de Oficiales
            </p>
            <NavLink to="/members" className={navLinkClass}>
              Recreadores
            </NavLink>

            {isAdmin && (
              <NavLink to="/admin/associations" className={navLinkClass}>
                Gestión de Asociaciones
              </NavLink>
            )}

            <NavLink to="/admin/events/crud" className={navLinkClass}>
              Gestión de Campañas
            </NavLink>
            <NavLink to="/admin/export" className={navLinkClass}>
              Intervención de Armas
            </NavLink>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-stone-200">
        <button
          onClick={handleLogout}
          className="w-full flex justify-center py-2 px-4 border border-stone-300 rounded-md shadow-sm text-sm font-bold text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-900 transition-colors"
        >
          Abandonar la Base
        </button>
      </div>
    </aside>
  );
}