// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';

import RequireAuth from './auth/RequireAuth';
import DashboardLayout from './components/layout/DashboardLayout';
import MembersPage from './pages/admin/MembersPage';
import EventsPage from './pages/EventsPage';
import ProfilePage from './pages/ProfilePage';
import AssociationsPage from './pages/AssociationsPage';
import WeaponsExportPage from './pages/admin/WeaponsExportPage';
import EventManagePage from './pages/admin/EventManagePage';
import AdminAssociationsPage from './pages/admin/AdminAssociationsPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
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
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="associations" element={<AssociationsPage />} />
            
            <Route path="members" 
              element={
                <RequireRole allowedRoles={['ADMIN', 'PRESIDENT', 'ROLE_ADMIN', 'ROLE_PRESIDENT']}>
                    <MembersPage />
                </RequireRole>
              } 
            />
            
            <Route 
              path="admin/export" 
              element={
                <RequireRole allowedRoles={['ADMIN', 'PRESIDENT', 'ROLE_ADMIN', 'ROLE_PRESIDENT']}>
                  <WeaponsExportPage />
                </RequireRole>
              } 
            />

            {/* ---> CRUD DE ASOCIACIONES <--- */}
            <Route 
              path="admin/associations" 
              element={
                <RequireRole allowedRoles={['ADMIN', 'PRESIDENT', 'ROLE_ADMIN', 'ROLE_PRESIDENT']}>
                  <AdminAssociationsPage />
                </RequireRole>
              } 
            />

            {/* ---> CRUD DE CAMPAÑAS Y EVENTOS <--- */}
            <Route 
              path="admin/events/crud" 
              element={
                <RequireRole allowedRoles={['ADMIN', 'PRESIDENT', 'ROLE_ADMIN', 'ROLE_PRESIDENT']}>
                  <AdminEventsPage />
                </RequireRole>
              } 
            />
            
            <Route 
              path="events/:eventId/manage" 
              element={
                <RequireRole allowedRoles={['ADMIN', 'PRESIDENT', 'ROLE_ADMIN', 'ROLE_PRESIDENT']}>
                  <EventManagePage />
                </RequireRole>
              } 
            />
          </Route>
          
          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}