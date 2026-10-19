import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Wallet,
  ArrowUpRight,
  ClipboardList,
  Mail,
  Crown,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  HeartHandshake,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Landmark,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const formatCLP = (val) => `$${Number(val || 0).toLocaleString('es-CL')} CLP`;

export default function DashboardHome() {
  const auth = useAuth();
  const { isAuthRestoring } = auth;

  if (isAuthRestoring) {
    return (
      <section className="grid min-h-[16rem] place-items-center" aria-busy="true">
        <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Verificando credenciales del Directorio...</span>
        </div>
      </section>
    );
  }

  const {
    currentUser,
    sociosList = [],
    voluntariosList = [],
    postulacionesList = [],
    postulacionesVoluntariadoList = [],
    expensesList = [],
    donacionesList = [],
    cobrosList = [],
    financialSettings = {},
    getDirectorioMember,
    isMasterUser,
    isDirectiva,
    canManageFinances,
    canManageVoluntarios
  } = auth;

  const canViewInstitutional = isMasterUser || isDirectiva;

  // Identificación del Cargo Ejecutivo del Directivo
  const presidente = getDirectorioMember ? getDirectorioMember('presidenteId') : null;
  const vicepresidente = getDirectorioMember ? getDirectorioMember('vicepresidenteId') : null;
  const secretario = getDirectorioMember ? getDirectorioMember('secretarioId') : null;
  const tesorero = getDirectorioMember ? getDirectorioMember('tesoreroId') : null;

  let cargoTitle = 'Miembro del Directorio Nacional';
  if (isMasterUser) cargoTitle = 'Administrador Maestro';
  else if (presidente?.email === currentUser?.email) cargoTitle = 'Presidente Nacional';
  else if (vicepresidente?.email === currentUser?.email) cargoTitle = 'Vicepresidente Nacional';
  else if (secretario?.email === currentUser?.email) cargoTitle = 'Secretario General';
  else if (tesorero?.email === currentUser?.email) cargoTitle = 'Tesorero Nacional';
  else if (currentUser?.role === 'socio') cargoTitle = 'Socio Activo de PRUANED';

  const firstName = currentUser?.name?.split(' ')[0] || 'Directivo';

  // KPIs de Padrón
  const activeSociosList = sociosList.filter(s => s.email !== 'ag.pruaned@gmail.com');
  const isSocioRenunciado = (s) => !!(
    s.estadoSocio === 'Renunciante' ||
    s.estadoCuota?.includes('Desvinculado') ||
    s.estadoCuota?.includes('Renuncia') ||
    s.motivoRenuncia ||
    s.fechaSolicitudRenuncia ||
    s.fechaRetiroOficial
  );

  const isSocioEnGracia = (s) => {
    if (s.estadoCuota !== 'En Gracia') return false;
    if (!s.graciaHasta) return true;
    const hasta = new Date(s.graciaHasta);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hasta >= hoy;
  };

  const isSocioExcluidoCobro = (s) => {
    return s.estadoSocio === 'Excluido de Cobro' || s.estadoCuota === 'Exento' || s.estadoCuota === 'Excluido de Cobro';
  };

  const isSocioExonerado = (s) => {
    return isSocioRenunciado(s) || s.categoria === 'Socio Honorario' || isSocioEnGracia(s) || isSocioExcluidoCobro(s) || s.estadoSocio === 'Suspendido';
  };

  const totalSociosActivos = activeSociosList.filter(s => !isSocioRenunciado(s)).length;
  const sociosEnGraciaCount = activeSociosList.filter(isSocioEnGracia).length;
  const sociosExcluidosCount = activeSociosList.filter(s => !isSocioRenunciado(s) && isSocioExcluidoCobro(s)).length;

  const sociosEnMora = activeSociosList.filter(s => {
    if (isSocioExonerado(s)) return false;
    const pendingCuotasEmitidas = cobrosList.filter(c => c.socioId === s.id && !c.pagado && c.titulo?.toLowerCase().startsWith('cuota')).length;
    const meses = Math.max(s.mesesAdeudados || 0, pendingCuotasEmitidas);
    return s.estadoCuota === 'En Mora' || meses >= 2;
  }).length;

  const sociosAlDia = Math.max(0, totalSociosActivos - sociosEnMora - sociosEnGraciaCount - sociosExcluidosCount);
  const porcentajeCumplimiento = Math.round((sociosAlDia / (totalSociosActivos || 1)) * 100);

  // Asuntos Pendientes del Directorio
  const postulacionesSociosPendientes = postulacionesList.filter(
    p => p.estado === 'Pendiente Revisión Directorio' || p.estado === 'Pendiente'
  ).length;

  const renunciasPendientes = sociosList.filter(
    s => (s.estadoCuota?.includes('Solicitud') || s.estadoSocio === 'Renunciante') && !s.fechaRetiroOficial
  ).length;

  const postulacionesVoluntariosPendientes = postulacionesVoluntariadoList.filter(
    p => p.estado === 'pendiente'
  ).length;

  const totalAsuntosPendientes = postulacionesSociosPendientes + renunciasPendientes;

  // Finanzas
  const totalEgresos = expensesList.reduce((acc, e) => acc + Number(e.monto || 0), 0);
  const recaudacionMensualEsperada = activeSociosList
    .filter(s => !isSocioExonerado(s))
    .reduce((acc, s) => acc + Number(s.montoCuotaMensual || financialSettings.cuotaMensualActual || 5000), 0);

  const cobrosImpagosCount = cobrosList.filter(c => !c.pagado).length;

  return (
    <section className="mx-auto max-w-7xl space-y-7 animate-fade-in font-['Plus_Jakarta_Sans'] pb-12">
      
      {/* =========================================================================
          1. HEADER EJECUTIVO DEL DIRECTORIO NACIONAL
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute right-1/3 -bottom-20 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Directorio Nacional PRUANED A.G.</span>
            </div>
            <h1 className="font-['Outfit'] text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Bienvenido, {firstName}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Panel de control centralizado y toma de decisiones estatutarias. Cargo actual: <strong className="text-amber-300 font-bold">{cargoTitle}</strong>.
            </p>
          </div>

          {/* Estado general rápido */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Padrón Electoral</div>
                <div className="text-sm font-extrabold text-white">{totalSociosActivos} Socios Activos</div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Salud Financiera</div>
                <div className="text-sm font-extrabold text-emerald-400">{porcentajeCumplimiento}% al día</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. BANDEJA DE ASUNTOS PENDIENTES DEL DIRECTORIO (REQUIEREN ACUERDO O FIRMA)
      ========================================================================= */}
      {canViewInstitutional && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Asuntos que Requieren Acuerdo o Revisión del Directorio
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {totalAsuntosPendientes} pendiente{totalAsuntosPendientes !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Tarjeta 1: Postulaciones Nuevos Socios */}
            <article className={`p-5 rounded-2xl border transition-all ${
              postulacionesSociosPendientes > 0 
                ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md' 
                : 'bg-white border-slate-200 opacity-90'
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Membresía Gremial</span>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Postulaciones de Socios</h3>
                  <p className="text-xs text-slate-600">Revisión de cartas de intención y aprobación oficial.</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${postulacionesSociosPendientes > 0 ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900 font-['Outfit']">
                  {postulacionesSociosPendientes}
                  <span className="text-xs font-medium text-slate-500 ml-1.5">en espera</span>
                </span>
                <Link
                  to="/intranet/postulaciones-socios"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                >
                  <span>Revisar</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>

            {/* Tarjeta 2: Solicitudes de Renuncia DL 2.757 */}
            <article className={`p-5 rounded-2xl border transition-all ${
              renunciasPendientes > 0 
                ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-sm hover:shadow-md' 
                : 'bg-white border-slate-200 opacity-90'
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Fe Pública &amp; DL 2.757</span>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Renuncias por Ratificar</h3>
                  <p className="text-xs text-slate-600">Acuerdos formales de renuncia para acta de Directorio.</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${renunciasPendientes > 0 ? 'bg-amber-600 text-white border-amber-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  <FileCheck2 className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900 font-['Outfit']">
                  {renunciasPendientes}
                  <span className="text-xs font-medium text-slate-500 ml-1.5">pendientes</span>
                </span>
                <Link
                  to="/intranet/directorio"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
                >
                  <span>Ver Actas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>

            {/* Tarjeta 3: Cobros y Emisión de Cuotas */}
            <article className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Cobranza &amp; Tesorería</span>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Cuotas por Recaudar</h3>
                  <p className="text-xs text-slate-600">Cobros emitidos con estado pendiente de pago.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900 font-['Outfit']">
                  {cobrosImpagosCount}
                  <span className="text-xs font-medium text-slate-500 ml-1.5">boletas pend.</span>
                </span>
                <Link
                  to="/intranet/socios"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm"
                >
                  <span>Padrón</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>

          </div>
        </div>
      )}

      {/* =========================================================================
          3. BENTO GRID EJECUTIVO: SALUD DEL PADRÓN Y BALANCE INSTITUCIONAL
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMNA IZQUIERDA (7 COLS): SALUD DEL PADRÓN DE SOCIOS */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Membresía Oficial</p>
              <h3 className="font-['Outfit'] text-xl font-extrabold text-slate-950 mt-0.5">Estado del Padrón de Socios</h3>
            </div>
            <Link
              to="/intranet/socios"
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
            >
              <span>Ver Padrón Completo</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Métricas Principales del Padrón */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Al Día</span>
              <span className="text-2xl font-black text-emerald-900 font-['Outfit'] mt-1 block">{sociosAlDia}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">{porcentajeCumplimiento}% del padrón</span>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">En Mora</span>
              <span className="text-2xl font-black text-rose-900 font-['Outfit'] mt-1 block">{sociosEnMora}</span>
              <span className="text-[10px] text-rose-700 font-semibold">2+ meses adeud.</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">En Gracia</span>
              <span className="text-2xl font-black text-amber-900 font-['Outfit'] mt-1 block">{sociosEnGraciaCount}</span>
              <span className="text-[10px] text-amber-700 font-semibold">Pausa formal</span>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">Excluidos</span>
              <span className="text-2xl font-black text-purple-900 font-['Outfit'] mt-1 block">{sociosExcluidosCount}</span>
              <span className="text-[10px] text-purple-700 font-semibold">Exentos cuota</span>
            </div>
          </div>

          {/* Barra de progreso de cumplimiento */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Índice de Cumplimiento Arancelario</span>
              <span className="font-extrabold text-slate-900">{porcentajeCumplimiento}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
              <div
                style={{ width: `${porcentajeCumplimiento}%` }}
                className="bg-emerald-500 rounded-full transition-all duration-500"
                title={`Al Día: ${sociosAlDia}`}
              />
              <div
                style={{ width: `${Math.round((sociosEnMora / (totalSociosActivos || 1)) * 100)}%` }}
                className="bg-rose-500 rounded-full transition-all duration-500"
                title={`En Mora: ${sociosEnMora}`}
              />
              <div
                style={{ width: `${Math.round(((sociosEnGraciaCount + sociosExcluidosCount) / (totalSociosActivos || 1)) * 100)}%` }}
                className="bg-amber-400 rounded-full transition-all duration-500"
                title={`En Gracia / Exentos: ${sociosEnGraciaCount + sociosExcluidosCount}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Al Día ({sociosAlDia})</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> En Mora ({sociosEnMora})</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Gracia / Exentos ({sociosEnGraciaCount + sociosExcluidosCount})</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (5 COLS): FINANZAS & RECAUDACIÓN */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tesorería General</p>
                <h3 className="font-['Outfit'] text-xl font-extrabold text-slate-950 mt-0.5">Resumen Financiero</h3>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700">
                <Landmark className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Proyección Mensual de Cuotas</span>
                <span className="text-2xl font-black text-slate-950 font-mono mt-1 block">
                  {formatCLP(recaudacionMensualEsperada)}
                </span>
                <span className="text-xs text-slate-600 font-medium">Base de cálculo sobre socios activos afectos.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Egresos</span>
                  <span className="text-lg font-black text-rose-700 font-mono mt-0.5 block">{formatCLP(totalEgresos)}</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Voluntarios</span>
                  <span className="text-lg font-black text-emerald-800 font-['Outfit'] mt-0.5 block">{voluntariosList.length} activos</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/intranet/finanzas"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <span>Ver Libro de Finanzas y Rendiciones</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* =========================================================================
          4. ACCESOS DIRECTOS DE ALTA FRECUENCIA (QUICK ACTIONS)
      ========================================================================= */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Operaciones Frecuentes del Directorio
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <Link
            to="/intranet/socios"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-center flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Emitir Cuotas</span>
            <span className="text-[10px] text-slate-500">Cobranza mensual</span>
          </Link>

          <Link
            to="/intranet/postulaciones-socios"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-center flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Postulaciones</span>
            <span className="text-[10px] text-slate-500">{postulacionesSociosPendientes} por revisar</span>
          </Link>

          <Link
            to="/intranet/comunicaciones"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 transition-all text-center flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Comunicado</span>
            <span className="text-[10px] text-slate-500">Correo masivo</span>
          </Link>

          <Link
            to="/intranet/directorio"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-center flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Crown className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Directorio</span>
            <span className="text-[10px] text-slate-500">Cargos y firmas</span>
          </Link>

          <Link
            to="/intranet/finanzas"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-100 transition-all text-center flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Finanzas</span>
            <span className="text-[10px] text-slate-500">Balance y egresos</span>
          </Link>

          <Link
            to="/intranet/auditoria"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 transition-all text-center flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Auditoría</span>
            <span className="text-[10px] text-slate-500">Logs del sistema</span>
          </Link>

        </div>
      </div>

    </section>
  );
}
