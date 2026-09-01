import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  UserPlus,
  HeartHandshake,
  ShieldCheck
} from 'lucide-react';

export const Navbar = ({ onOpenAuth }) => {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const publicNavItems = [
    { path: '/', label: 'Inicio', icon: Shield },
    { path: '/institucional', label: 'La asociación', icon: Building },
    { path: '/transparencia', label: 'Transparencia', icon: ShieldCheck },
    { path: '/noticias', label: 'Actualidad', icon: Newspaper },
    { path: '/documentos', label: 'Recursos', icon: FileText },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md text-white font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-20">
          
          {/* Logo Brand */}
          <Link
            to="/"
            aria-label="Ir al inicio de PRUANED"
            onClick={handleNavClick}
            className="flex min-w-0 max-w-[calc(100%-3.5rem)] shrink items-center group bg-white/95 px-3 py-1.5 rounded-xl border border-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            <PRUANEDLogo className="h-9 min-w-0 max-w-full" showText={true} />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* Authenticated Intranet Shortcuts */}
            {currentUser && (
              <>
                {(currentUser.role === 'socio' || currentUser.role === 'master' || currentUser.role === 'directiva') && (
                  <Link
                    to="/intranet/socios"
                    onClick={handleNavClick}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      location.pathname === '/intranet/socios' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-amber-950/40'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Intranet Socios
                  </Link>
                )}

                {(currentUser.role === 'voluntario') && (
                  <Link
                    to="/intranet/voluntarios"
                    onClick={handleNavClick}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      location.pathname === '/intranet/voluntarios' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-950/40'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" /> Intranet Voluntarios
                  </Link>
                )}

                {(currentUser.role === 'master' || currentUser.role === 'directiva') && (
                  <Link
                    to="/intranet/admin"
                    onClick={handleNavClick}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      location.pathname === '/intranet/admin' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-950/40'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Panel CMS
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link to="/postulacion-voluntariado" onClick={handleNavClick} className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 px-3 py-2 text-xs font-bold text-sky-200 transition hover:bg-sky-950/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">
              <HeartHandshake className="h-4 w-4" /> Voluntariado
            </Link>
            <Link to="/postulacion" onClick={handleNavClick} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
              <UserPlus className="h-4 w-4" /> Únete
            </Link>
          </div>

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
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition-all border border-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
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
              aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              aria-expanded={mobileMenuOpen}
              aria-controls="navegacion-movil"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
          <nav id="navegacion-movil" aria-label="Navegación principal" className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2 animate-fade-in">
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
            })}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/postulacion-voluntariado" onClick={handleNavClick} className="flex min-h-11 items-center justify-center rounded-xl border border-sky-500/40 px-3 text-center text-xs font-bold text-sky-200">Voluntariado</Link>
              <Link to="/postulacion" onClick={handleNavClick} className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-3 text-center text-xs font-bold text-white">Únete</Link>
            </div>

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
        </nav>
      )}
    </header>
  );
};
