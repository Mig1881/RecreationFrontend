import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Componente temporal para simular páginas
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <h1 className="text-3xl font-bold text-slate-800 font-serif">{title}</h1>
  </div>
);

export default function App() {
  const { state } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Placeholder title="Página de Login (Pública)" />} />
        <Route path="/register" element={<Placeholder title="Página de Registro (Pública)" />} />

        {/* Rutas Privadas */}
        <Route 
          path="/" 
          element={
            state.isAuthenticated ? (
              <Placeholder title="Dashboard de Recreadores (Privada)" />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Fallback para rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}