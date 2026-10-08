// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';

import RequireAuth from './auth/RequireAuth';
import DashboardLayout from './components/layout/DashboardLayout';
import MembersPage from './pages/admin/MembersPage';
import RequireRole from './auth/RequireRole';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rutas Privadas (Protegidas por Layout y RequireAuth) */}
          <Route 
            path="/" 
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            } 
          >
            {/* Todas las rutas anidadas aquí aparecerán dentro del <Outlet /> del DashboardLayout */}
            <Route index element={<HomePage />} />
            <Route path="members" 
              element={
                <RequireRole allowedRoles={['ADMIN', 'PRESIDENT', 'ROLE_ADMIN', 'ROLE_PRESIDENT']}>
                    <MembersPage />
                </RequireRole>
              } 
            />
            {/* Aquí iremos añadiendo las siguientes: */}
            {/* <Route path="events" element={<EventsPage />} /> */}
            {/* <Route path="associations" element={<AssociationsPage />} /> */}
          </Route>
          
          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}