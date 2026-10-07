// src/context/AuthContext.tsx
import React, { createContext, useReducer, useEffect, useContext, type ReactNode } from 'react';

// 1. Definición de Tipos estrictos mapeados del backend
export interface User {
  id: number;
  email: string;
  roles: string[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export type AuthAction =
  | { type: 'LOGIN'; payload: { token: string; user: User } }
  | { type: 'LOGOUT' };

// 2. Estado Inicial: Intentamos recuperar la sesión del LocalStorage
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
  isAuthenticated: !!localStorage.getItem('token'),
};

// 3. El Reducer: La única forma de mutar el estado de autenticación
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

// 4. Creación del Contexto
interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 5. El Provider: Envolverá a nuestra aplicación
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Efecto A: Sincronizar el estado de React con LocalStorage para persistencia
  useEffect(() => {
    if (state.token && state.user) {
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [state.token, state.user]);

  // Efecto B: Escuchar expulsiones forzosas desde la red (apiClient)
  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

// 6. Hook Personalizado (Custom Hook) para consumir el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};