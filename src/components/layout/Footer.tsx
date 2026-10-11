// src/components/layout/Footer.tsx
import { MapPin, Mail, ExternalLink, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import aneLogo from '../../assets/ANE.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-800 text-stone-300 border-t-4 border-amber-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white">
              <div className="bg-white p-1.5 rounded-lg shadow-sm flex-shrink-0">
                <img src={aneLogo} alt="Escudo ANE" className="h-10 w-auto object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-wider uppercase">Mando Central</h3>
                <p className="text-amber-500 text-xs font-bold tracking-widest">A.N.E. INTRANET</p>
              </div>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed text-justify">
              Plataforma logística y operativa de la Asociación Napoleónica Española. 
              Coordinando y unificando los esfuerzos de la recreación histórica desde el Acta de Cacabelos en el año 2000.
            </p>
            <div className="pt-2">
              <a 
                href="https://www.asocne.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 font-medium transition-colors"
              >
                Visitar portal público <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-4 border-b border-stone-600 pb-2">
              Panel de Operaciones
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-amber-500 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-amber-500 transition-colors" />
                  Inicio / Cuartel
                </Link>
              </li>
              <li>
                <Link to="/associations" className="text-sm hover:text-amber-500 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-amber-500 transition-colors" />
                  Catálogo de Regimientos
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm hover:text-amber-500 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-amber-500 transition-colors" />
                  Campañas y Maniobras
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm hover:text-amber-500 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-amber-500 transition-colors" />
                  Expediente Personal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-4 border-b border-stone-600 pb-2">
              Comandancia
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">
                  Sede Central Operativa<br />
                  Zaragoza, España
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <a href="mailto:presidente@ane.es" className="text-sm hover:text-white transition-colors">
                  presidente@ane.es
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      <div className="bg-stone-900 py-4 border-t border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-stone-400">
            &copy; {currentYear} Asociación Napoleónica Española. Todos los derechos reservados.
          </p>
          <p className="text-xs text-stone-400 flex items-center gap-1">
            Sistema de Gestión V1.0
          </p>
        </div>
      </div>
    </footer>
  );
}