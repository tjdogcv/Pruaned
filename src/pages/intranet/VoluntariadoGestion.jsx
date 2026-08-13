import { BarChart3, CheckCircle2, ClipboardList, GraduationCap, Loader2, Search, TrendingUp, Users, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseProgress } from '../../lib/lmsProgress';

function rate(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

export default function VoluntariadoGestion() {
  const {
    canManageVoluntarios,
    voluntariosList = [],
    lmsCourses = [],
    lmsParticipants = [],
    lmsResults = [],
    lmsModuleProgress = [],
    isLmsLoading
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const volunteers = useMemo(() => {
    const participantsByEmail = new Map(lmsParticipants.map((participant) => [participant.email?.toLowerCase(), participant]));
    return voluntariosList.map((volunteer) => {
      const participant = participantsByEmail.get(volunteer.email?.toLowerCase());
      return {
        id: volunteer.id,
        userId: participant?.userId || null,
        nombre: participant?.displayName || volunteer.nombre,
        email: volunteer.email,
        especialidad: volunteer.especialidad,
        nivelAcreditacion: volunteer.nivelAcreditacion,
        hasAccount: Boolean(participant)
      };
    });
  }, [lmsParticipants, voluntariosList]);

  const courseMetrics = useMemo(() => {
    const volunteerUserIds = new Set(volunteers.map((volunteer) => volunteer.userId).filter(Boolean));
    return lmsCourses.map((course) => {
    const courseResults = lmsResults.filter((result) => result.courseId === course.id && volunteerUserIds.has(result.userId));
    const approved = courseResults.filter((result) => result.status === 'aprobado').length;
    const failed = courseResults.filter((result) => result.status === 'reprobado').length;
    const inProgress = courseResults.filter((result) => result.status === 'en_progreso').length;
    const scores = courseResults.map((result) => Number(result.score)).filter((score) => Number.isFinite(score));
    return { course, approved, failed, inProgress, averageScore: scores.length ? scores.reduce((total, score) => total + score, 0) / scores.length : null };
  });
  }, [lmsCourses, lmsResults, volunteers]);

  const rows = useMemo(() => volunteers.map((volunteer) => {
    const participantResults = lmsResults.filter((result) => result.userId === volunteer.userId);
    const participantProgress = lmsModuleProgress.filter((progress) => progress.userId === volunteer.userId);
    const totalModules = lmsCourses.reduce((total, course) => total + course.modules.length, 0);
    const completedModules = lmsCourses.reduce((total, course) => total + courseProgress(course, participantProgress).completedModules, 0);
    const approved = participantResults.filter((result) => result.status === 'aprobado').length;
    return { ...volunteer, approved, totalModules, completedModules, percentage: rate(completedModules, totalModules) };
  }), [lmsCourses, lmsModuleProgress, lmsResults, volunteers]);

  const filteredRows = rows.filter((volunteer) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || [volunteer.nombre, volunteer.email, volunteer.especialidad, volunteer.nivelAcreditacion]
      .some((value) => (value || '').toLowerCase().includes(query));
  });

  if (!canManageVoluntarios) return <Navigate to="/intranet/voluntarios" replace />;
  if (isLmsLoading) return <div className="grid min-h-64 place-items-center" aria-busy="true"><p role="status" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Cargando indicadores académicos…</p></div>;

  const totalApproved = courseMetrics.reduce((total, metric) => total + metric.approved, 0);
  const totalPossible = volunteers.length * lmsCourses.length;

  return (
    <section className="min-h-screen bg-slate-50 py-2 font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Coordinación operativa</p><h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Gestión de voluntariado</h2><p className="mt-2 text-sm leading-6 text-slate-600">Padrón, avance por módulo y resultados de evaluación del voluntariado.</p></div><label className="relative block w-full max-w-sm"><span className="sr-only">Buscar voluntario</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar voluntario" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" /></label></header>

        <div className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Users className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" /><p className="text-2xl font-extrabold">{volunteers.length}</p><p className="mt-1 text-sm font-semibold text-slate-600">Voluntarios registrados</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><GraduationCap className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" /><p className="text-2xl font-extrabold">{totalApproved}</p><p className="mt-1 text-sm font-semibold text-slate-600">Aprobaciones vigentes</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><TrendingUp className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" /><p className="text-2xl font-extrabold">{rate(totalApproved, totalPossible)}%</p><p className="mt-1 text-sm font-semibold text-slate-600">Aprobación agregada</p></article></div>

        <section aria-labelledby="course-progress-title"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-700" aria-hidden="true" /><h3 id="course-progress-title" className="font-['Outfit'] text-lg font-extrabold">Resultados por curso</h3></div>{courseMetrics.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courseMetrics.map(({ course, approved, failed, inProgress, averageScore }) => <article key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold text-emerald-700">{course.code || 'Curso'}</p><h4 className="mt-2 font-['Outfit'] font-extrabold text-slate-950">{course.title}</h4><dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Aprobados</dt><dd className="mt-1 font-extrabold text-emerald-700">{approved}</dd></div><div><dt className="text-slate-500">En progreso</dt><dd className="mt-1 font-extrabold text-slate-900">{inProgress}</dd></div><div><dt className="text-slate-500">Reprobados</dt><dd className="mt-1 font-extrabold text-rose-700">{course.hasEvaluation ? failed : 'No aplica'}</dd></div><div><dt className="text-slate-500">Nota promedio</dt><dd className="mt-1 font-extrabold text-slate-900">{averageScore === null ? (course.hasEvaluation ? 'Sin intentos' : 'No aplica') : `${averageScore.toFixed(1)}%`}</dd></div></dl></article>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">No hay cursos publicados.</p>}</section>

        <section aria-labelledby="volunteer-list-title" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><ClipboardList className="h-5 w-5 text-emerald-700" aria-hidden="true" /><h3 id="volunteer-list-title" className="font-['Outfit'] text-lg font-extrabold">Padrón y avance individual</h3></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-bold">Voluntario</th><th className="px-5 py-3 font-bold">Acreditación</th><th className="px-5 py-3 font-bold">Cursos aprobados</th><th className="px-5 py-3 font-bold">Módulos completados</th><th className="px-5 py-3 font-bold">Avance</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredRows.map((volunteer) => <tr key={volunteer.id}><td className="px-5 py-4"><p className="font-bold text-slate-950">{volunteer.nombre}</p><p className="mt-1 text-xs text-slate-500">{volunteer.hasAccount ? volunteer.email : 'Sin cuenta LMS asociada'}</p></td><td className="px-5 py-4 text-slate-700">{volunteer.nivelAcreditacion || 'Sin nivel registrado'}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{volunteer.approved}/{lmsCourses.length}</span></td><td className="px-5 py-4 font-semibold text-slate-700">{volunteer.completedModules}/{volunteer.totalModules}</td><td className="px-5 py-4"><div className="flex min-w-36 items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${volunteer.percentage}%` }} /></div><span className="font-bold text-slate-700">{volunteer.percentage}%</span></div></td></tr>)}</tbody></table></div>{!filteredRows.length && <p className="p-8 text-center text-sm text-slate-500">No se encontraron voluntarios.</p>}</section>

        <aside className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600"><XCircle className="mt-0.5 h-5 w-5 flex-none text-slate-500" aria-hidden="true" /><p>Los indicadores se calculan con el último resultado persistido por curso. Quienes aún no crean su cuenta LMS se muestran en el padrón, sin progreso académico asociado.</p></aside>
      </div>
    </section>
  );
}
