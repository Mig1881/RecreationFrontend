// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RequireAuth from './auth/RequireAuth';

// Componente temporal para simular el Dashboard protegido
const DashboardPlaceholder = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
    <h1 className="text-3xl font-bold text-stone-800 font-serif mb-4">Dashboard Principal</h1>
    <p className="text-stone-600">¡Bienvenido a la Base! Estás autenticado.</p>
  </div>
);

export default function App() {
  return (
    // Envolvuelvo toda la aplicación con el proveedor de autenticación
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rutas Privadas (Protegidas por nuestro Guardián) */}
          <Route 
            path="/" 
            element={
              <RequireAuth>
                <DashboardPlaceholder />
              </RequireAuth>
            } 
          />
          
          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}