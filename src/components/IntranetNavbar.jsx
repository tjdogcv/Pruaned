import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import {
  LogOut, Users, GraduationCap, FileText, Shield,
  LayoutDashboard, Menu, X, ChevronRight, Bell,
  Settings, Home
} from 'lucide-react';

export const IntranetNavbar = () => {
  const { currentUser, logout, isMasterUser, isDirectiva, canManageVoluntarios } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Foto de perfil: usa la del socio si existe
  const fotoPerfil = currentUser?.fotoPerfil || null;
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // Etiqueta de rol legible
  const rolLabel = {
    master: 'Master',
    directiva: 'Directiva',
    socio: 'Socio/a',
    voluntario: 'Voluntario/a'
  }[currentUser?.role] || currentUser?.role;

  // Color de badge por rol
  const rolColor = {
    master: 'bg-amber-500 text-amber-950',
    directiva: 'bg-blue-600 text-white',
    socio: 'bg-slate-600 text-white',
    voluntario: 'bg-emerald-700 text-white'
  }[currentUser?.role] || 'bg-slate-600 text-white';

  // Nav items según rol
  const navItems = [
    { path: '/intranet/socios', label: 'Mi Cuenta & Socios', icon: Users,
      show: currentUser?.role === 'socio' || currentUser?.role === 'master' || currentUser?.role === 'directiva' },
    { path: '/intranet/voluntarios', label: 'Gestión Voluntarios', icon: GraduationCap,
      show: canManageVoluntarios },
    { path: '/intranet/admin', label: 'Panel CMS', icon: FileText,
      show: isMasterUser || isDirectiva },
    { path: '/intranet/seguridad', label: 'Seguridad', icon: Shield,
      show: isMasterUser },
  ].filter(item => item.show);

  const isActive = (path) => location.pathname === path;

  if (!currentUser) return null;

  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50 shadow-lg font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Logo + INTRANET badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center bg-white/95 px-2.5 py-1 rounded-lg border border-slate-700 hover:opacity-90 transition-opacity">
              <PRUANEDLogo className="h-7 w-auto" showText={false} />
            </Link>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">PRUANED A.G.</div>
              <div className="text-xs font-extrabold text-white leading-tight">Intranet Privada</div>
            </div>
            {/* Breadcrumb pill */}
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {location.pathname.replace('/intranet/', '').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Center: Intranet Nav Links (desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
            {/* Volver al sitio público */}
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all border-l border-slate-700 ml-2 pl-4"
            >
              <Home className="w-3.5 h-3.5" />
              Sitio Público
            </Link>
          </nav>

          {/* Right: User Profile Card + Logout */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Avatar */}
            <div className="flex items-center gap-2.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
              {fotoPerfil ? (
                <img
                  src={fotoPerfil}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-500 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight max-w-[140px] truncate">{currentUser.name}</div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${rolColor}`}>
                  {rolLabel}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-5 space-y-1 animate-fade-in">
          {/* User info mobile */}
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl mb-3">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold">{initials}</div>
            )}
            <div>
              <div className="text-sm font-bold text-white">{currentUser.name}</div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${rolColor}`}>{rolLabel}</span>
            </div>
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold w-full ${
                  isActive(item.path) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-700"
            >
              <Home className="w-4 h-4" /> Sitio Público
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
