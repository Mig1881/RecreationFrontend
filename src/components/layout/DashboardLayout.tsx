// src/components/layout/DashboardLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Menú lateral fijo a la izquierda */}
      <Sidebar />

      {/* Área principal de contenido */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Aquí se inyectarán las páginas protegidas (Inicio, Eventos, etc.) */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}