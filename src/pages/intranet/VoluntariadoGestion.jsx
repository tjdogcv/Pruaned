import { BarChart3, CheckCircle2, ClipboardList, GraduationCap, Search, TrendingUp, Users, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function completionRate(completed, total) {
  return total ? Math.round((completed / total) * 100) : 0;
}

export default function VoluntariadoGestion() {
  const { canManageVoluntarios, voluntariosList = [], coursesList = [] } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const courseMetrics = useMemo(() => coursesList.map(course => {
    const completed = voluntariosList.filter(voluntario => (voluntario.cursosAprobados || []).includes(course.id)).length;
    return { course, completed, pending: Math.max(voluntariosList.length - completed, 0) };
  }), [coursesList, voluntariosList]);

  const filteredVolunteers = voluntariosList.filter(voluntario => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [voluntario.nombre, voluntario.rut, voluntario.especialidad, voluntario.nivelAcreditacion]
      .some(value => (value || '').toLowerCase().includes(query));
  });

  if (!canManageVoluntarios) return <Navigate to="/intranet/voluntarios" replace />;

  return (
    <section className="min-h-screen bg-slate-50 py-2 font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Coordinación operativa</p>
            <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Gestión de voluntariado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Consulta el padrón de voluntarios y el avance académico disponible por persona y curso.</p>
          </div>
          <label className="relative block w-full max-w-sm">
            <span className="sr-only">Buscar voluntario</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Buscar voluntario" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </label>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Users className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" /><p className="text-2xl font-extrabold">{voluntariosList.length}</p><p className="mt-1 text-sm font-semibold text-slate-600">Voluntarios registrados</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><GraduationCap className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" /><p className="text-2xl font-extrabold">{courseMetrics.reduce((total, metric) => total + metric.completed, 0)}</p><p className="mt-1 text-sm font-semibold text-slate-600">Aprobaciones registradas</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><TrendingUp className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" /><p className="text-2xl font-extrabold">{completionRate(courseMetrics.reduce((total, metric) => total + metric.completed, 0), voluntariosList.length * courseMetrics.length)}%</p><p className="mt-1 text-sm font-semibold text-slate-600">Avance académico agregado</p></article>
        </div>

        <section aria-labelledby="course-progress-title">
          <div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-700" aria-hidden="true" /><h3 id="course-progress-title" className="font-['Outfit'] text-lg font-extrabold">Avance por módulo</h3></div>
          {courseMetrics.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courseMetrics.map(({ course, completed, pending }) => {
            const hasAssessment = Array.isArray(course.examQuestions) && course.examQuestions.length > 0;
            return (
            <article key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-emerald-700">{course.code || 'Curso'}</p><h4 className="mt-2 font-['Outfit'] font-extrabold text-slate-950">{course.title}</h4>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${completionRate(completed, voluntariosList.length)}%` }} /></div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Aprobados</dt><dd className="mt-1 font-extrabold text-emerald-700">{completed}</dd></div><div><dt className="text-slate-500">Pendientes</dt><dd className="mt-1 font-extrabold text-slate-900">{pending}</dd></div><div><dt className="text-slate-500">Reprobados</dt><dd className="mt-1 font-extrabold text-slate-700">{hasAssessment ? 'Sin datos' : 'No aplica'}</dd></div><div><dt className="text-slate-500">Nota promedio</dt><dd className="mt-1 font-extrabold text-slate-700">{hasAssessment ? 'Sin datos' : 'No aplica'}</dd></div></dl>
              {hasAssessment && <p className="mt-4 text-xs leading-5 text-slate-500">Se requiere registro académico persistente para consolidar resultados de evaluación.</p>}
            </article>
          ); })}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">No hay módulos publicados.</p>}
        </section>

        <section aria-labelledby="volunteer-list-title" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><ClipboardList className="h-5 w-5 text-emerald-700" aria-hidden="true" /><h3 id="volunteer-list-title" className="font-['Outfit'] text-lg font-extrabold">Padrón y avance individual</h3></div>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-bold">Voluntario</th><th className="px-5 py-3 font-bold">Acreditación</th><th className="px-5 py-3 font-bold">Cursos aprobados</th><th className="px-5 py-3 font-bold">Avance</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredVolunteers.map(voluntario => { const completed = (voluntario.cursosAprobados || []).filter(id => coursesList.some(course => course.id === id)).length; const rate = completionRate(completed, coursesList.length); return <tr key={voluntario.id}><td className="px-5 py-4"><p className="font-bold text-slate-950">{voluntario.nombre}</p><p className="mt-1 text-xs text-slate-500">{voluntario.especialidad || 'Sin especialidad registrada'}</p></td><td className="px-5 py-4 text-slate-700">{voluntario.nivelAcreditacion || 'Sin nivel registrado'}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{completed}/{coursesList.length}</span></td><td className="px-5 py-4"><div className="flex min-w-36 items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${rate}%` }} /></div><span className="font-bold text-slate-700">{rate}%</span></div></td></tr>; })}</tbody></table></div>
          {!filteredVolunteers.length && <p className="p-8 text-center text-sm text-slate-500">No se encontraron voluntarios.</p>}
        </section>

        <aside className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><XCircle className="mt-0.5 h-5 w-5 flex-none text-amber-700" aria-hidden="true" /><p>Los datos actuales sólo registran cursos aprobados. Para medir evaluaciones reprobadas, notas promedio e intentos se requiere un registro académico persistente por participante y curso.</p></aside>
      </div>
    </section>
  );
}
