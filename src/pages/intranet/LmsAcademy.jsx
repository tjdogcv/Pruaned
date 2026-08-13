import { BookOpen, CheckCircle2, ClipboardCheck, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function audiencesFor(course) {
  const audience = Array.isArray(course.audience) ? course.audience : ['socios', 'voluntarios'];
  return audience.includes('socios') && audience.includes('voluntarios')
    ? 'Socios y voluntarios'
    : audience.includes('socios')
      ? 'Solo socios'
      : 'Solo voluntarios';
}

export default function LmsAcademy() {
  const { currentUser, coursesList = [], voluntariosList = [] } = useAuth();
  const learnerRole = currentUser?.role === 'voluntario' ? 'voluntarios' : 'socios';
  const ownVoluntario = voluntariosList.find(voluntario => voluntario.email?.toLowerCase() === currentUser?.email?.toLowerCase());
  const completedCourseIds = ownVoluntario?.cursosAprobados || [];
  const availableCourses = coursesList.filter(course => {
    const audience = Array.isArray(course.audience) ? course.audience : ['socios', 'voluntarios'];
    return audience.includes(learnerRole);
  });
  const learnerLabel = learnerRole === 'voluntarios' ? 'Voluntarios' : 'Socios';

  return (
    <section className="min-h-screen bg-slate-50 py-2 font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="max-w-3xl border-b border-slate-200 pb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Formación institucional</p>
          <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Aula virtual PRUANED</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Material formativo para socios y voluntarios. Cada curso indica claramente a quién está dirigido.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BookOpen className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" />
            <p className="text-2xl font-extrabold text-slate-950">{availableCourses.length}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">Cursos disponibles</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" />
            <p className="text-2xl font-extrabold text-slate-950">{completedCourseIds.length}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">Cursos aprobados</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Users className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" />
            <p className="text-2xl font-extrabold text-slate-950">{learnerLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">Perfil de formación</p>
          </article>
        </div>

        {availableCourses.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {availableCourses.map(course => {
              const completed = completedCourseIds.includes(course.id);
              const hasAssessment = Array.isArray(course.examQuestions) && course.examQuestions.length > 0;
              return (
                <article key={course.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800">{course.code || 'Curso PRUANED'}</span>
                    {completed && <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Aprobado</span>}
                  </div>
                  <h3 className="mt-4 font-['Outfit'] text-lg font-extrabold leading-6 text-slate-950">{course.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{course.description || 'Contenido formativo institucional de PRUANED.'}</p>
                  <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <div className="flex items-center justify-between gap-3"><dt>Dirigido a</dt><dd className="font-bold text-slate-900">{audiencesFor(course)}</dd></div>
                    <div className="flex items-center justify-between gap-3"><dt>Duración</dt><dd className="font-bold text-slate-900">{course.duration || course.hours || 'Por definir'}</dd></div>
                    <div className="flex items-center justify-between gap-3"><dt>Evaluación</dt><dd className="font-bold text-slate-900">{hasAssessment ? 'Incluida' : 'Sin evaluación'}</dd></div>
                  </dl>
                  <details className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
                    <summary className="cursor-pointer font-bold text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Ver material del curso</summary>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      {(course.modules || []).length ? course.modules.map((module, index) => <li key={`${course.id}-module-${index}`} className="flex gap-2"><span className="font-bold text-emerald-700">{index + 1}.</span>{module}</li>) : <li>El contenido detallado se publicará próximamente.</li>}
                    </ul>
                  </details>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <h3 className="mt-3 font-['Outfit'] text-lg font-extrabold text-slate-950">No hay cursos disponibles para tu perfil</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Cuando se publique contenido dirigido a tu perfil, aparecerá en esta área.</p>
          </div>
        )}

        <aside className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <ClipboardCheck className="mt-0.5 h-5 w-5 flex-none text-slate-500" aria-hidden="true" />
          <p>El historial visible registra aprobaciones disponibles. El detalle de intentos, notas y avance por módulo se habilitará cuando el registro académico persistente esté disponible.</p>
        </aside>
      </div>
    </section>
  );
}
