// src/auth/RequireRole.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface RequireRoleProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { state } = useAuth();
  const { user, isAuthenticated } = state;

  //Se Verifica si estamos en un estado de "limbo" (hay sesión pero faltan datos)
  if (isAuthenticated && !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-slate-500 font-serif text-xl">Verificando credenciales...</p>
      </div>
    );
  }

  //Si no está autenticado, fuera.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  //Se Comprueba si ALGUNO de los roles del usuario coincide con los permitidos
  const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role));

  if (!hasRequiredRole) {
    // Si no tiene permisos, lo devolvemos al inicio protegido
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}