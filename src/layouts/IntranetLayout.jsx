import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PencilRuler,
  Search,
  Shield,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { useAuth } from '../context/AuthContext';

function initialsFor(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function safeAvatarUrl(value) {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (/^https?:\/\//i.test(url)) return url;

  const dataUrl = /^data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/]+={0,2})$/i.exec(url);
  if (!dataUrl) return null;

  try {
    return atob(dataUrl[1]).length > 0 ? url : null;
  } catch {
    return null;
  }
}

function SidebarContent({ navItems, pathname, onNavigate, onClose, mobile, currentUser, avatarUrl, onAvatarError, onLogout, isLoggingOut }) {
  const navigationGroups = [
    { label: 'Principal', items: navItems.filter(({ group }) => group === 'principal') },
    { label: 'Gesti\u00f3n', items: navItems.filter(({ group }) => group === 'gestion') },
    { label: 'Administraci\u00f3n', items: navItems.filter(({ group }) => group === 'administracion') }
  ].filter(({ items }) => items.length > 0);

  return (
    <>
      <div className="flex h-[4.5rem] items-center justify-between border-b border-slate-800/90 px-5">
        <Link to="/intranet/dashboard" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={onNavigate}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm"><PRUANEDLogo className="h-6 w-auto" showText={false} /></span>
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">PRUANED A.G.</span>
            <span className="block text-sm font-extrabold tracking-tight text-white">Espacio privado</span>
          </span>
        </Link>
        {mobile && (
          <button ref={onClose.ref} type="button" onClick={onClose.action} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label="Cerrar menú de navegación">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Navegación de la intranet">
        {navigationGroups.map(({ label: groupLabel, items }) => (
          <div key={groupLabel} className="space-y-1.5">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{groupLabel}</p>
            {items.map(({ path, label, icon: Icon }) => {
              const active = pathname === path;
              return (
                <Link key={path} to={path} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-4 flex min-w-0 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" onError={onAvatarError} className="h-10 w-10 flex-none rounded-full border-2 border-blue-400 object-cover" />
          ) : (
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white">{initialsFor(currentUser?.name)}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{currentUser?.name || currentUser?.email || 'Usuario'}</p>
            <p className="truncate text-xs capitalize text-slate-400">{currentUser?.role || 'Miembro'}</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} disabled={isLoggingOut} aria-busy={isLoggingOut} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>
    </>
  );
}

export function IntranetLayout() {
  const auth = useAuth();
  const { isAuthRestoring } = auth;
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuButtonRef = useRef(null);
  const drawerCloseRef = useRef(null);

  useEffect(() => {
    if (isAuthRestoring || !mobileOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const frame = window.requestAnimationFrame(() => drawerCloseRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isAuthRestoring, mobileOpen]);

  const closeMobileNavigation = () => setMobileOpen(false);
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await auth.logout();
    } finally {
      setMobileOpen(false);
      setIsLoggingOut(false);
      navigate('/', { replace: true });
    }
  };

  if (isAuthRestoring) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 font-['Plus_Jakarta_Sans'] text-slate-900" aria-busy="true">
        <p role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-sm">
          Verificando sesión…
        </p>
      </main>
    );
  }

  const { currentUser, isMasterUser, isDirectiva, canManageVoluntarios, isLmsManager } = auth;
  const navItems = [
    { path: '/intranet/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'principal' },
    { path: '/intranet/voluntarios', label: 'Aula virtual', icon: GraduationCap, group: 'principal' },
    { path: '/intranet/documentos', label: 'Documentos de socios', icon: FileText, group: 'principal', show: currentUser?.role === 'socio' || isMasterUser || isDirectiva },
    { path: '/intranet/voluntarios/gestion/aula', label: 'Administrar aula virtual', icon: PencilRuler, group: 'principal', show: isLmsManager },
    { path: '/intranet/socios', label: 'Socios', icon: Users, group: 'gestion', show: currentUser?.role === 'socio' || isMasterUser || isDirectiva },
    { path: '/intranet/directorio', label: 'Directorio', icon: ClipboardList, group: 'gestion', show: isMasterUser || isDirectiva },
    { path: '/intranet/finanzas', label: 'Finanzas', icon: Wallet, group: 'gestion', show: isMasterUser || isDirectiva },
    { path: '/intranet/voluntarios/gestion', label: 'Gestión de voluntariado', icon: ClipboardList, group: 'gestion', show: canManageVoluntarios },
    { path: '/intranet/admin', label: 'Contenidos', icon: FileText, group: 'administracion', show: isMasterUser || isDirectiva },
    { path: '/intranet/auditoria', label: 'Auditoría', icon: ClipboardList, group: 'administracion', show: isMasterUser || isDirectiva },
    { path: '/intranet/seguridad', label: 'Seguridad', icon: Shield, group: 'administracion', show: isMasterUser }
  ].filter(({ show }) => show !== false);
  const activeItem = navItems.find(({ path }) => path === location.pathname);
  const searchResults = searchQuery.trim()
    ? navItems.filter(({ label }) => label.toLocaleLowerCase('es-CL').includes(searchQuery.trim().toLocaleLowerCase('es-CL')))
    : [];
  const avatarUrl = avatarFailed ? null : safeAvatarUrl(currentUser?.fotoPerfil);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const [firstMatch] = searchResults;
    if (!firstMatch) return;
    navigate(firstMatch.path);
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans'] text-slate-900">
      <a href="#intranet-content" className="sr-only z-[60] rounded-b-lg bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow focus:not-sr-only focus:absolute focus:left-4 focus:top-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Saltar al contenido</a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-slate-950 lg:flex" aria-label="Barra lateral de la intranet">
        <SidebarContent navItems={navItems} pathname={location.pathname} onNavigate={() => {}} currentUser={currentUser} avatarUrl={avatarUrl} onAvatarError={() => setAvatarFailed(true)} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      </aside>

      {mobileOpen && (
        <>
          <button type="button" aria-label="Cerrar menú de navegación" className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] lg:hidden" onClick={closeMobileNavigation} />
          <aside id="intranet-mobile-navigation" className="fixed inset-y-0 left-0 z-50 flex w-[min(19rem,calc(100vw-1.5rem))] flex-col bg-slate-950 shadow-2xl lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
            <SidebarContent navItems={navItems} pathname={location.pathname} onNavigate={closeMobileNavigation} onClose={{ ref: drawerCloseRef, action: closeMobileNavigation }} mobile currentUser={currentUser} avatarUrl={avatarUrl} onAvatarError={() => setAvatarFailed(true)} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
          </aside>
        </>
      )}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button ref={menuButtonRef} type="button" onClick={() => setMobileOpen(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden" aria-label="Abrir menú de navegación" aria-expanded={mobileOpen} aria-controls="intranet-mobile-navigation">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="hidden text-xs font-semibold text-slate-500 sm:block">Intranet <span className="px-1 text-slate-300">/</span> <span className="text-slate-700">{activeItem?.label || 'Inicio'}</span></p>
                <h1 className="truncate font-['Outfit'] text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">{activeItem?.label || 'Intranet'}</h1>
              </div>
            </div>

            <form className="relative hidden w-full max-w-sm md:block" role="search" onSubmit={handleSearchSubmit}>
              <label className="sr-only" htmlFor="intranet-search">Buscar una sección</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input id="intranet-search" type="search" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)} placeholder="Ir a una sección" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100" aria-expanded={searchOpen && searchResults.length > 0} aria-controls="intranet-search-results" />
              {searchOpen && searchQuery.trim() && (
                <div id="intranet-search-results" role="listbox" className="absolute right-0 top-[calc(100%+0.5rem)] w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {searchResults.length ? searchResults.map(({ path, label, icon: Icon }) => (
                    <Link key={path} to={path} role="option" className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" onMouseDown={() => { setSearchOpen(false); setSearchQuery(''); }}>
                      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {label}
                    </Link>
                  )) : <p className="px-3 py-2 text-sm text-slate-500">Sin secciones disponibles.</p>}
                </div>
              )}
            </form>
          </div>
        </header>

        <main id="intranet-content" tabIndex="-1" className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
