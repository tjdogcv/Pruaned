import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, Landmark, Users, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const currency = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

export default function DashboardHome() {
  const auth = useAuth();
  const { isAuthRestoring } = auth;

  if (isAuthRestoring) {
    return (
      <section className="grid min-h-[16rem] place-items-center" aria-busy="true">
        <p role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
          Verificando sesión…
        </p>
      </section>
    );
  }

  const {
    currentUser,
    sociosList = [],
    voluntariosList = [],
    postulacionesList = [],
    expensesList = [],
    cobrosList = [],
    isMasterUser,
    isDirectiva,
    canManageFinances,
    canManageVoluntarios
  } = auth;

  const canViewInstitutional = isMasterUser || isDirectiva;
  const name = currentUser?.name?.split(' ')[0] || 'miembro';

  const metrics = [];
  if (canViewInstitutional) {
    metrics.push({ label: 'Socios registrados', value: sociosList.length, icon: Users, tone: 'text-blue-700 bg-blue-50 border-blue-100' });
  }
  if (canManageVoluntarios) {
    metrics.push({ label: 'Voluntarios activos', value: voluntariosList.length, icon: ClipboardList, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' });
  }
  if (canManageFinances) {
    metrics.push({ label: 'Cobros pendientes', value: cobrosList.filter(({ pagado }) => !pagado).length, icon: Wallet, tone: 'text-amber-700 bg-amber-50 border-amber-100' });
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8 sm:py-9">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Área privada PRUANED</p>
          <h1 className="mt-2 font-['Outfit'] text-3xl font-extrabold tracking-tight sm:text-4xl">Bienvenido, {name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Consulta el estado institucional y accede a los módulos autorizados para tu cuenta.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
          </article>
        ))}
      </div>

      {(canManageFinances || canViewInstitutional) && (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          {canManageFinances && (() => {
            const totalExpenses = expensesList.reduce((total, { monto }) => total + Number(monto || 0), 0);
            return (
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Resumen financiero</p>
                    <p className="mt-2 font-['Outfit'] text-3xl font-extrabold tracking-tight text-slate-950">{currency.format(totalExpenses)}</p>
                    <p className="mt-1 text-sm text-slate-500">Egresos registrados en el periodo disponible.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Landmark className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <Link to="/intranet/finanzas" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  Ver panel financiero <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })()}

          {canViewInstitutional && (() => {
            const pendingApplications = postulacionesList.filter(
              ({ estado }) => estado === 'Pendiente Revisión Directorio'
            ).length;
            return (
              <article className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Revisión de directorio</p>
                <p className="mt-3 text-4xl font-extrabold tracking-tight text-blue-950">{pendingApplications}</p>
                <p className="mt-1 text-sm text-blue-900/70">Postulaciones pendientes de revisión.</p>
                <Link to="/intranet/socios" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  Abrir padrón <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })()}
        </div>
      )}
    </section>
  );
}
