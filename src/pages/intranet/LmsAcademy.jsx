import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  PlayCircle,
  RotateCcw,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  assessmentLabel,
  courseProgress,
  normalizeAudience,
  resultForCourse
} from '../../lib/lmsProgress';

function audienceLabel(course) {
  const audience = normalizeAudience(course.audience);
  if (audience.includes('socios') && audience.includes('voluntarios')) return 'Socios y voluntarios';
  return audience.includes('socios') ? 'Solo socios' : 'Solo voluntarios';
}

function statusLabel(status) {
  return ({
    aprobado: 'Aprobado',
    reprobado: 'Reprobado',
    en_progreso: 'En progreso',
    sin_iniciar: 'Sin iniciar'
  })[status] || 'Sin iniciar';
}

export default function LmsAcademy() {
  const {
    currentUser,
    lmsProfile,
    lmsCourses = [],
    lmsResults = [],
    lmsModuleProgress = [],
    isLmsLoading,
    completeLmsModule,
    getLmsAssessment,
    submitLmsAssessment
  } = useAuth();
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [pendingModuleId, setPendingModuleId] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const learnerAudiences = lmsProfile?.audiences || (currentUser?.role === 'voluntario' ? ['voluntarios'] : ['socios']);
  const availableCourses = useMemo(
    () => lmsCourses.filter((course) => normalizeAudience(course.audience)
      .some((audience) => learnerAudiences.includes(audience))),
    [learnerAudiences, lmsCourses]
  );
  const ownResults = lmsResults.filter((result) => !result.userId || result.userId === lmsProfile?.userId);
  const ownModuleProgress = lmsModuleProgress.filter((progress) => !progress.userId || progress.userId === lmsProfile?.userId);
  const approvedCourses = ownResults.filter((result) => result.status === 'aprobado').length;

  const handleCompleteModule = async (module, courseId) => {
    setActionError('');
    setPendingModuleId(module.id);
    try {
      await completeLmsModule(module.id, courseId);
    } catch (error) {
      setActionError(error.message || 'No se pudo registrar el módulo. Intenta nuevamente.');
    } finally {
      setPendingModuleId(null);
    }
  };

  const openAssessment = async (course) => {
    setActionError('');
    setAssessment({ course, questions: [], loading: true });
    setAnswers({});
    try {
      const questions = await getLmsAssessment(course.id);
      setAssessment({ course, questions, loading: false });
    } catch (error) {
      setAssessment(null);
      setActionError(error.message || 'No se pudo cargar la evaluación.');
    }
  };

  const handleSubmitAssessment = async (event) => {
    event.preventDefault();
    if (!assessment) return;
    setActionError('');
    setIsSubmitting(true);
    try {
      await submitLmsAssessment(assessment.course.id, answers);
      setAssessment(null);
      setAnswers({});
    } catch (error) {
      setActionError(error.message || 'No se pudo registrar la evaluación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLmsLoading) {
    return (
      <div className="grid min-h-64 place-items-center" aria-busy="true">
        <p role="status" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando aula virtual…
        </p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 py-2 font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="max-w-3xl border-b border-slate-200 pb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Formación institucional</p>
          <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Aula virtual PRUANED</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Cursos para socios y voluntarios. Tu avance se registra de forma segura en tu cuenta.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric icon={BookOpen} value={availableCourses.length} label="Cursos disponibles" />
          <Metric icon={CheckCircle2} value={approvedCourses} label="Cursos aprobados" />
          <Metric icon={GraduationCap} value={lmsProfile?.participantType === 'voluntario' ? 'Voluntario/a' : 'Socio/a'} label="Perfil de formación" />
        </div>

        {actionError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{actionError}</div>}

        {availableCourses.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {availableCourses.map((course) => {
              const result = resultForCourse(ownResults, course.id);
              const progress = courseProgress(course, ownModuleProgress, result);
              const expanded = expandedCourseId === course.id;
              return (
                <article key={course.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800">{course.code || 'Curso PRUANED'}</span>
                    <span className={`text-xs font-bold ${progress.status === 'aprobado' ? 'text-emerald-700' : progress.status === 'reprobado' ? 'text-rose-700' : 'text-slate-600'}`}>{statusLabel(progress.status)}</span>
                  </div>
                  <h3 className="mt-4 font-['Outfit'] text-lg font-extrabold leading-6 text-slate-950">{course.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{course.description || 'Contenido formativo institucional de PRUANED.'}</p>
                  <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <Fact label="Dirigido a" value={audienceLabel(course)} />
                    <Fact label="Duración" value={course.duration || course.hours || 'Por definir'} />
                    <Fact label="Evaluación" value={assessmentLabel(course)} />
                  </dl>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600"><span>Avance de módulos</span><span>{progress.completedModules}/{progress.totalModules}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${progress.percentage}%` }} /></div>
                  </div>
                  {progress.score !== null && <p className="mt-3 text-xs font-semibold text-slate-600">Última nota: <span className="text-slate-900">{Number(progress.score).toFixed(1)}%</span> · Intentos: {progress.attempts}</p>}
                  <button type="button" onClick={() => setExpandedCourseId(expanded ? null : course.id)} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                    <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    {expanded ? 'Ocultar contenido' : 'Ver material'}
                  </button>
                  {expanded && (
                    <CourseMaterial
                      course={course}
                      completedModules={ownModuleProgress}
                      pendingModuleId={pendingModuleId}
                      onComplete={handleCompleteModule}
                      onAssessment={openAssessment}
                      progress={progress}
                    />
                  )}
                </article>
              );
            })}
          </div>
        ) : <EmptyCourses />}

        <aside className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <ClipboardCheck className="mt-0.5 h-5 w-5 flex-none text-slate-500" aria-hidden="true" />
          <p>Las evaluaciones se corrigen en el servidor. Las alternativas correctas no se exponen en el navegador.</p>
        </aside>
      </div>

      {assessment && <AssessmentDialog assessment={assessment} answers={answers} isSubmitting={isSubmitting} onAnswer={setAnswers} onClose={() => setAssessment(null)} onSubmit={handleSubmitAssessment} />}
    </section>
  );
}

function Metric({ icon: Icon, value, label }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" /><p className="text-2xl font-extrabold text-slate-950">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{label}</p></article>;
}

function Fact({ label, value }) {
  return <div className="flex justify-between gap-3"><dt>{label}</dt><dd className="font-bold text-slate-900">{value}</dd></div>;
}

function CourseMaterial({ course, completedModules, pendingModuleId, onComplete, onAssessment, progress }) {
  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      {course.modules.length ? course.modules.map((module) => {
        const completed = completedModules.some((entry) => entry.moduleId === module.id);
        const pending = pendingModuleId === module.id;
        return <div key={module.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{module.position + 1}. {module.title}</p>{module.content && <p className="mt-1 text-xs leading-5 text-slate-600">{module.content}</p>}</div><button type="button" disabled={completed || pending} onClick={() => onComplete(module, course.id)} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-2.5 text-xs font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-default disabled:bg-emerald-100 disabled:text-emerald-800">{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : completed ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />}{completed ? 'Completado' : 'Completar'}</button></div></div>;
      }) : <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">El contenido detallado se publicará próximamente.</p>}
      {course.hasEvaluation && <button type="button" disabled={progress.totalModules > 0 && progress.completedModules < progress.totalModules} onClick={() => onAssessment(course)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"><ClipboardCheck className="h-4 w-4" aria-hidden="true" />{progress.status === 'reprobado' ? 'Reintentar evaluación' : 'Rendir evaluación'}</button>}
    </div>
  );
}

function EmptyCourses() {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><GraduationCap className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" /><h3 className="mt-3 font-['Outfit'] text-lg font-extrabold text-slate-950">No hay cursos disponibles para tu perfil</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Cuando se publique contenido dirigido a tu perfil, aparecerá aquí.</p></div>;
}

function AssessmentDialog({ assessment, answers, isSubmitting, onAnswer, onClose, onSubmit }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="lms-assessment-title"><form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Evaluación</p><h2 id="lms-assessment-title" className="mt-1 font-['Outfit'] text-xl font-extrabold text-slate-950">{assessment.course.title}</h2></div><button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950" aria-label="Cerrar evaluación"><XCircle className="h-5 w-5" aria-hidden="true" /></button></div>{assessment.loading ? <p className="mt-8 inline-flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Cargando preguntas…</p> : <><div className="mt-6 space-y-6">{assessment.questions.map((question, index) => <fieldset key={question.id}><legend className="text-sm font-bold leading-6 text-slate-900">{index + 1}. {question.prompt}</legend><div className="mt-3 space-y-2">{(question.options || []).map((option, optionIndex) => <label key={`${question.id}-${optionIndex}`} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"><input required type="radio" name={question.id} value={optionIndex} checked={answers[question.id] === String(optionIndex)} onChange={(event) => onAnswer((previous) => ({ ...previous, [question.id]: event.target.value }))} className="mt-0.5 accent-emerald-700" /><span>{option}</span></label>)}</div></fieldset>)}</div><div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancelar</button><button disabled={isSubmitting || !assessment.questions.length} type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}Enviar evaluación</button></div></>}</form></div>;
}
