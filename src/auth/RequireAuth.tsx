// src/auth/RequireAuth.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { state } = useAuth();

  // Si no hay token en el estado, lo expulsamos a la pantalla de login
  if (!state.token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}