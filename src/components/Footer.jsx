import React, { useState } from 'react';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { PrivacyDataPolicy } from './PrivacyDataPolicy';
import { INSTITUTIONAL_INFO } from '../data/initialData';
import { Mail, Globe, MapPin, Instagram, ShieldCheck, Lock } from 'lucide-react';

export const Footer = ({ onNavigate }) => {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-10 border-t border-slate-800 font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          
          {/* Col 1: Identity */}
          <div className="space-y-3">
            <div className="bg-white p-2 rounded-xl inline-block border border-slate-700">
              <PRUANEDLogo className="h-9 w-auto" showText={true} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light italic">
              "{INSTITUTIONAL_INFO.motto}"
            </p>
            <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-slate-800 pt-2">
              <p>Entidad Gremial Regida por Decreto Ley N° 2.757 de 1979</p>
              <p>Chile — Cobertura Nacional e Internacional</p>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-white font-bold text-sm font-['Outfit'] mb-3 border-b border-slate-800 pb-1.5">
              Navegación Institucional
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('institutional')} className="hover:text-white transition-colors">
                  Estatutos y Reglamento General 2025
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('postulacion')} className="hover:text-white transition-colors">
                  Postulación de Nuevos Socios
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('news')} className="hover:text-white transition-colors">
                  Noticias & Comunicados Oficiales
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('docs')} className="hover:text-white transition-colors">
                  Repositorio Documental Público
                </button>
              </li>
              <li>
                <button onClick={() => setIsPrivacyModalOpen(true)} className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ley N° 21.719 Protección de Datos
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Frameworks */}
          <div>
            <h4 className="text-white font-bold text-sm font-['Outfit'] mb-3 border-b border-slate-800 pb-1.5">
              Marco de Actuación
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {INSTITUTIONAL_INFO.frameworks.map((fw, idx) => (
                <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                  {fw}
                </span>
              ))}
            </div>
          </div>

          {/* Col 4: Contact & Social */}
          <div>
            <h4 className="text-white font-bold text-sm font-['Outfit'] mb-3 border-b border-slate-800 pb-1.5">
              Contacto y Redes Oficiales
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <a href={`mailto:${INSTITUTIONAL_INFO.email}`} className="hover:text-emerald-400 transition-colors">
                  {INSTITUTIONAL_INFO.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <a href={`https://${INSTITUTIONAL_INFO.domain}`} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">
                  {INSTITUTIONAL_INFO.domain}
                </a>
              </li>
              <li className="flex items-start gap-2 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{INSTITUTIONAL_INFO.address}</span>
              </li>
              <li className="pt-1">
                <a 
                  href={INSTITUTIONAL_INFO.instagram} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow transition-transform hover:scale-105"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram @pruaned
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} PRUANED A.G. — Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-slate-300">
              Política de Privacidad Ley N° 21.719
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Sistema Seguro Cifrado 2FA
            </span>
          </div>
        </div>

      </div>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <PrivacyDataPolicy onClose={() => setIsPrivacyModalOpen(false)} />
        </div>
      )}
    </footer>
  );
};
