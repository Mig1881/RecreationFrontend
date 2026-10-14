// src/components/layout/DashboardLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Menú lateral fijo a la izquierda */}
      <Sidebar />

      {/* Área principal de contenido: Añadimos flex y flex-col */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        
        {/* Contenedor del Outlet: Añadimos flex-1 y w-full para que empuje el Footer abajo */}
        <div className="p-8 max-w-7xl mx-auto w-full flex-1">
          {/* Aquí se inyectarán las páginas protegidas (Inicio, Eventos, etc.) */}
          <Outlet />
        </div>

        {/* Pie de página corporativo */}
        <Footer />
        
      </main>
    </div>
  );
}