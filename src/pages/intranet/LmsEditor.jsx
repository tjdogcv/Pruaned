import { Archive, BookOpen, ChevronLeft, ClipboardCheck, GripVertical, Loader2, Pencil, Plus, RotateCcw, Save, Trash2, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCourseVideoEmbedUrl, normalizeAudience } from '../../lib/lmsProgress';

const emptyModule = () => ({ title: '', content: '', videoUrl: '' });
const emptyQuestion = () => ({ prompt: '', options: ['', ''], correctOption: 0 });
const emptyCourse = () => ({
  code: '',
  title: '',
  description: '',
  hours: '',
  duration: '',
  instructor: '',
  status: 'draft',
  audience: ['socios', 'voluntarios'],
  videoUrl: ''
});

function toEditorModel(payload) {
  const course = payload?.course || {};
  return {
    id: course.id || null,
    course: {
      ...emptyCourse(),
      ...course,
      audience: normalizeAudience(course.audience),
      videoUrl: course.video_url || course.videoUrl || ''
    },
    modules: (payload?.modules || []).map((module) => ({
      title: module.title || '',
      content: module.content || '',
      videoUrl: module.video_url || module.videoUrl || ''
    })),
    questions: (payload?.questions || []).map((question) => ({
      prompt: question.prompt || '',
      options: Array.isArray(question.options) ? question.options : ['', ''],
      correctOption: Number(question.correct_option ?? question.correctOption ?? 0)
    }))
  };
}

export default function LmsEditor() {
  const {
    isLmsManager,
    isLmsLoading,
    lmsCourses = [],
    getLmsCourseEditor,
    saveLmsCourseBundle,
    archiveLmsCourse,
    restoreLmsCourse
  } = useAuth();
  const [model, setModel] = useState(() => ({ id: null, course: emptyCourse(), modules: [emptyModule()], questions: [] }));
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [busyCourseId, setBusyCourseId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const courses = useMemo(
    () => [...lmsCourses].sort((first, second) => String(first.title).localeCompare(String(second.title), 'es')),
    [lmsCourses]
  );
  const isPublished = model.course.status === 'published';
  const validVideo = !model.course.videoUrl || Boolean(getCourseVideoEmbedUrl(model.course.videoUrl));
  const validModuleVideos = model.modules.every((module) => !module.videoUrl || Boolean(getCourseVideoEmbedUrl(module.videoUrl)));

  if (!isLmsLoading && !isLmsManager) return <Navigate to="/intranet/voluntarios/gestion" replace />;
  if (isLmsLoading) return <div className="grid min-h-64 place-items-center" aria-busy="true"><p role="status" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Verificando permisos editoriales…</p></div>;

  const resetForm = () => {
    setModel({ id: null, course: emptyCourse(), modules: [emptyModule()], questions: [] });
    setError('');
    setNotice('Formulario nuevo listo. Publica sólo cuando el contenido esté revisado.');
  };

  const updateCourse = (field, value) => setModel((previous) => ({ ...previous, course: { ...previous.course, [field]: value } }));
  const updateModule = (index, field, value) => setModel((previous) => ({
    ...previous,
    modules: previous.modules.map((module, moduleIndex) => moduleIndex === index ? { ...module, [field]: value } : module)
  }));
  const updateQuestion = (index, field, value) => setModel((previous) => ({
    ...previous,
    questions: previous.questions.map((question, questionIndex) => questionIndex === index ? { ...question, [field]: value } : question)
  }));

  const toggleAudience = (audience) => setModel((previous) => {
    const selected = normalizeAudience(previous.course.audience);
    const next = selected.includes(audience) ? selected.filter((item) => item !== audience) : [...selected, audience];
    return { ...previous, course: { ...previous.course, audience: next.length ? next : selected } };
  });

  const openCourse = async (courseId) => {
    setError('');
    setNotice('');
    setIsLoadingCourse(true);
    try {
      const payload = await getLmsCourseEditor(courseId);
      setModel(toEditorModel(payload));
    } catch (requestError) {
      setError(requestError.message || 'No fue posible cargar este curso para edición.');
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!model.course.code.trim() || !model.course.title.trim()) {
      setError('Código y título son obligatorios.');
      return;
    }
    if (!validVideo || !validModuleVideos) {
      setError('Cada video debe ser un enlace HTTPS de YouTube o Google Drive.');
      return;
    }
    if (isPublished && !model.modules.some((module) => module.title.trim())) {
      setError('Un curso publicado necesita al menos un módulo con título.');
      return;
    }
    if (model.questions.some((question) => !question.prompt.trim() || question.options.filter((option) => option.trim()).length < 2)) {
      setError('Cada pregunta requiere un enunciado y al menos dos alternativas.');
      return;
    }

    setIsSaving(true);
    try {
      const courseId = await saveLmsCourseBundle({
        courseId: model.id,
        course: { ...model.course, code: model.course.code.trim().toUpperCase(), title: model.course.title.trim() },
        modules: model.modules.filter((module) => module.title.trim()).map((module) => ({ title: module.title.trim(), content: module.content.trim(), videoUrl: module.videoUrl.trim() })),
        questions: model.questions.map((question) => ({
          prompt: question.prompt.trim(),
          options: question.options.map((option) => option.trim()).filter(Boolean),
          correctOption: Number(question.correctOption)
        }))
      });
      setModel((previous) => ({ ...previous, id: courseId }));
      setNotice(model.id ? 'Curso actualizado. Los cambios se han guardado.' : 'Curso creado como parte del catálogo LMS.');
    } catch (requestError) {
      setError(requestError.message || 'No fue posible guardar el curso.');
    } finally {
      setIsSaving(false);
    }
  };

  const setArchiveState = async (course) => {
    setError('');
    setNotice('');
    setBusyCourseId(course.id);
    try {
      if (course.status === 'archived') {
        await restoreLmsCourse(course.id);
        setNotice('Curso restaurado como borrador para que puedas revisarlo antes de publicarlo.');
      } else {
        await archiveLmsCourse(course.id);
        setNotice('Curso archivado. Sus avances y notas permanecen intactos.');
      }
    } catch (requestError) {
      setError(requestError.message || 'No fue posible cambiar el estado del curso.');
    } finally {
      setBusyCourseId(null);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 py-2 font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl"><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Administración editorial</p><h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Aula virtual</h2><p className="mt-2 text-sm leading-6 text-slate-600">Crea cursos, estructura sus módulos y publica evaluaciones. Los cursos con actividad no se reescriben: archívalos y crea una nueva versión.</p></div>
          <Link to="/intranet/voluntarios/gestion" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Volver a indicadores</Link>
        </header>

        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p>}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <form onSubmit={saveCourse} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{model.id ? 'Edición' : 'Nuevo curso'}</p><h3 className="mt-1 font-['Outfit'] text-xl font-extrabold">{model.course.title || 'Contenido sin título'}</h3></div><button type="button" onClick={resetForm} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Plus className="h-4 w-4" aria-hidden="true" />Nuevo curso</button></div>

            <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Datos del curso</legend><Field label="Código" required><input required value={model.course.code} onChange={(event) => updateCourse('code', event.target.value)} placeholder="PRU-LMS-003" className="input" /></Field><Field label="Estado"><select value={model.course.status} onChange={(event) => updateCourse('status', event.target.value)} className="input"><option value="draft">Borrador</option><option value="published">Publicado</option></select></Field><Field label="Título" required className="sm:col-span-2"><input required value={model.course.title} onChange={(event) => updateCourse('title', event.target.value)} className="input" /></Field><Field label="Descripción" className="sm:col-span-2"><textarea value={model.course.description} onChange={(event) => updateCourse('description', event.target.value)} rows="3" className="input resize-y" /></Field><Field label="Docente o responsable"><input value={model.course.instructor} onChange={(event) => updateCourse('instructor', event.target.value)} className="input" /></Field><Field label="Duración visible"><input value={model.course.duration} onChange={(event) => updateCourse('duration', event.target.value)} placeholder="4 horas" className="input" /></Field><Field label="Horas acreditables"><input inputMode="decimal" value={model.course.hours} onChange={(event) => updateCourse('hours', event.target.value)} placeholder="4" className="input" /></Field><Field label="Video introductorio"><input type="url" value={model.course.videoUrl} onChange={(event) => updateCourse('videoUrl', event.target.value)} placeholder="YouTube o Google Drive" aria-invalid={!validVideo} className="input" /></Field></fieldset>

            <fieldset><legend className="text-sm font-bold text-slate-900">Dirigido a</legend><p className="mt-1 text-xs text-slate-500">Selecciona al menos una audiencia; el servidor vuelve a validarlo antes de publicar.</p><div className="mt-3 flex flex-wrap gap-3"><Audience checked={model.course.audience.includes('socios')} label="Socios" onChange={() => toggleAudience('socios')} /><Audience checked={model.course.audience.includes('voluntarios')} label="Voluntarios" onChange={() => toggleAudience('voluntarios')} /></div></fieldset>

            <EditorSection icon={BookOpen} title="Módulos del curso" action="Agregar módulo" onAdd={() => setModel((previous) => ({ ...previous, modules: [...previous.modules, emptyModule()] }))}>
              {model.modules.map((module, index) => <div key={`module-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-sm font-bold"><GripVertical className="h-4 w-4 text-slate-400" aria-hidden="true" />Módulo {index + 1}</p><RemoveButton disabled={model.modules.length === 1} onClick={() => setModel((previous) => ({ ...previous, modules: previous.modules.filter((_, moduleIndex) => moduleIndex !== index) }))} /></div><div className="grid gap-3"><Field label="Título del módulo"><input value={module.title} onChange={(event) => updateModule(index, 'title', event.target.value)} className="input" /></Field><Field label="Material o instrucciones"><textarea value={module.content} onChange={(event) => updateModule(index, 'content', event.target.value)} rows="3" className="input resize-y" /></Field><Field label="Video de este módulo"><input type="url" value={module.videoUrl} onChange={(event) => updateModule(index, 'videoUrl', event.target.value)} placeholder="YouTube o Google Drive" className="input" /></Field></div></div>)}
            </EditorSection>

            <EditorSection icon={ClipboardCheck} title="Evaluación (opcional)" action="Agregar pregunta" onAdd={() => setModel((previous) => ({ ...previous, questions: [...previous.questions, emptyQuestion()] }))}>
              {!model.questions.length && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Sin evaluación: al completar todos los módulos, el curso se aprobará automáticamente.</p>}
              {model.questions.map((question, index) => <div key={`question-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold">Pregunta {index + 1}</p><RemoveButton onClick={() => setModel((previous) => ({ ...previous, questions: previous.questions.filter((_, questionIndex) => questionIndex !== index) }))} /></div><Field label="Enunciado"><textarea value={question.prompt} onChange={(event) => updateQuestion(index, 'prompt', event.target.value)} rows="2" className="input resize-y" /></Field><div className="mt-4 space-y-2">{question.options.map((option, optionIndex) => <div key={`option-${optionIndex}`} className="flex items-center gap-2"><input type="radio" name={`correct-${index}`} checked={Number(question.correctOption) === optionIndex} onChange={() => updateQuestion(index, 'correctOption', optionIndex)} aria-label={`Marcar alternativa ${optionIndex + 1} como correcta`} className="h-4 w-4 accent-emerald-700" /><input value={option} onChange={(event) => setModel((previous) => ({ ...previous, questions: previous.questions.map((item, questionIndex) => questionIndex !== index ? item : { ...item, options: item.options.map((current, currentIndex) => currentIndex === optionIndex ? event.target.value : current) }) }))} placeholder={`Alternativa ${optionIndex + 1}`} className="input" /><button type="button" disabled={question.options.length <= 2} onClick={() => setModel((previous) => ({ ...previous, questions: previous.questions.map((item, questionIndex) => questionIndex !== index ? item : { ...item, options: item.options.filter((_, currentIndex) => currentIndex !== optionIndex), correctOption: item.correctOption >= item.options.length - 1 ? 0 : item.correctOption }) }))} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40" aria-label="Quitar alternativa"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>)}</div><button type="button" onClick={() => setModel((previous) => ({ ...previous, questions: previous.questions.map((item, questionIndex) => questionIndex === index ? { ...item, options: [...item.options, ''] } : item) }))} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"><Plus className="h-4 w-4" aria-hidden="true" />Agregar alternativa</button></div>)}
            </EditorSection>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">El enlace de video se valida en el navegador y nuevamente en la base de datos. Las alternativas correctas sólo se entregan al servidor.</p><button disabled={isSaving || isLoadingCourse} type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{isSaving ? 'Guardando…' : model.id ? 'Guardar cambios' : 'Crear curso'}</button></div>
          </form>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Catálogo</p><h3 className="mt-1 font-['Outfit'] text-lg font-extrabold">Cursos existentes</h3></div><Video className="h-5 w-5 text-emerald-700" aria-hidden="true" /></div><div className="mt-5 space-y-3">{courses.length ? courses.map((course) => <article key={course.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-bold text-emerald-700">{course.code || 'Sin código'}</p><h4 className="mt-1 truncate text-sm font-extrabold text-slate-950">{course.title}</h4></div><StatusBadge status={course.status} /></div><div className="mt-3 flex gap-2"><button type="button" disabled={isLoadingCourse || busyCourseId === course.id} onClick={() => openCourse(course.id)} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Editar</button><button type="button" disabled={busyCourseId === course.id} onClick={() => setArchiveState(course)} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{busyCourseId === course.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : course.status === 'archived' ? <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> : <Archive className="h-3.5 w-3.5" aria-hidden="true" />}{course.status === 'archived' ? 'Restaurar' : 'Archivar'}</button></div></article>) : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">Aún no hay cursos. Crea el primero con contenido revisado.</p>}</div><p className="mt-5 text-xs leading-5 text-slate-500">Archivar retira el curso del aula sin eliminar avances, notas ni módulos.</p></aside>
        </div>
      </div>
    </section>
  );
}

function Field({ label, required, className = '', children }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-bold text-slate-800">{label}{required && <span aria-hidden="true"> *</span>}</span>{children}</label>;
}

function Audience({ checked, label, onChange }) {
  return <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"><input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-emerald-700" />{label}</label>;
}

function EditorSection({ icon: Icon, title, action, onAdd, children }) {
  return <section className="space-y-4 border-t border-slate-100 pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h4 className="inline-flex items-center gap-2 font-['Outfit'] text-lg font-extrabold"><Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />{title}</h4><button type="button" onClick={onAdd} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 px-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50"><Plus className="h-4 w-4" aria-hidden="true" />{action}</button></div>{children}</section>;
}

function RemoveButton({ disabled, onClick }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Quitar</button>;
}

function StatusBadge({ status }) {
  const labels = { published: 'Publicado', draft: 'Borrador', archived: 'Archivado' };
  const colors = { published: 'bg-emerald-50 text-emerald-800', draft: 'bg-amber-50 text-amber-800', archived: 'bg-slate-100 text-slate-600' };
  return <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${colors[status] || colors.draft}`}>{labels[status] || 'Borrador'}</span>;
}
