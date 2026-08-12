import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { 
  Shield, 
  Users, 
  GraduationCap, 
  FileText, 
  Newspaper, 
  Lock, 
  LogOut, 
  Menu, 
  X, 
  Building,
  UserPlus
} from 'lucide-react';

export const Navbar = ({ onOpenAuth }) => {
  const { currentUser, logout, activeTab, setActiveTab } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicNavItems = [
    { id: 'home', label: 'Inicio', icon: Shield },
    { id: 'institutional', label: 'Estatutos & Direcciones', icon: Building },
    { id: 'postulacion', label: 'Hazte Socio', icon: UserPlus },
    { id: 'news', label: 'Noticias', icon: Newspaper },
    { id: 'docs', label: 'Documentos Públicos', icon: FileText },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand */}
          <div 
            className="flex items-center cursor-pointer group bg-white/95 px-3 py-1.5 rounded-xl border border-slate-700" 
            onClick={() => handleNavClick('home')}
          >
            <PRUANEDLogo className="h-9 w-auto" showText={true} />
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isHighlight = item.id === 'postulacion';

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : isHighlight
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}

            {/* Authenticated Intranet Shortcuts */}
            {currentUser && (
              <>
                {(currentUser.role === 'socio' || currentUser.role === 'admin') && (
                  <button
                    onClick={() => handleNavClick('socios')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'socios' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-amber-950/40'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Intranet Socios
                  </button>
                )}

                {(currentUser.role === 'voluntario' || currentUser.role === 'admin') && (
                  <button
                    onClick={() => handleNavClick('voluntarios')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'voluntarios' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-950/40'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" /> Intranet Voluntarios
                  </button>
                )}

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'admin' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-950/40'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Panel CMS
                  </button>
                )}
              </>
            )}
          </nav>

          {/* User Auth Action Button */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
                <div className="text-left text-xs">
                  <div className="font-bold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold capitalize">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Cerrar Sesión Segura"
                  className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all border border-emerald-400/30"
              >
                <Lock className="w-3.5 h-3.5" />
                Acceso Intranets (Seguro)
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2 animate-fade-in">
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800">
            {currentUser ? (
              <button
                onClick={logout}
                className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs"
              >
                Cerrar Sesión
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Acceso Intranets Privadas
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
