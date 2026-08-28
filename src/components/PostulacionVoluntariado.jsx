import { useState } from 'react';
import { CheckCircle2, HeartHandshake, Loader2, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AREAS = ['Respuesta en emergencias', 'Bienestar animal', 'Logística y acopio', 'Capacitación', 'Comunicaciones', 'Apoyo administrativo'];
const RECURSOS = ['Transporte propio', 'Botiquín o insumos', 'Equipo de comunicaciones', 'Espacio de acopio', 'Ninguno por ahora'];
const initialForm = {
  nombreCompleto: '', rut: '', email: '', telefono: '', region: '', comuna: '', profesionEspecialidad: '',
  experiencia: '', disponibilidad: '', areasInteres: [], recursos: [], motivacion: '', aceptaTerminos: false
};

function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function PostulacionVoluntariado() {
  const { addPostulacionVoluntario } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: 'idle', message: '' });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.aceptaTerminos) {
      setState({ status: 'error', message: 'Debes autorizar el tratamiento de tus datos para enviar la postulación.' });
      return;
    }
    setState({ status: 'loading', message: '' });
    const result = await addPostulacionVoluntario(form);
    if (result?.ok) {
      setState({ status: 'success', message: 'Recibimos tu postulación. La coordinación de voluntariado la revisará antes de habilitar tu acceso.' });
      setForm(initialForm);
      return;
    }
    setState({ status: 'error', message: result?.error?.message || 'No pudimos enviar la postulación. Revisa tus datos e inténtalo nuevamente.' });
  };

  return (
    <section className="min-h-screen bg-slate-50 py-10 font-['Plus_Jakarta_Sans'] text-slate-900 sm:py-14">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
        <aside className="self-start rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-9 lg:sticky lg:top-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300"><HeartHandshake className="h-4 w-4" aria-hidden="true" /> Voluntariado PRUANED</span>
          <h1 className="mt-5 font-['Outfit'] text-3xl font-extrabold tracking-tight sm:text-4xl">Tu tiempo puede marcar la diferencia.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">Postula para apoyar el bienestar animal en emergencias, actividades comunitarias y el trabajo permanente de PRUANED.</p>
          <ol className="mt-8 space-y-4 text-sm text-slate-200">
            {['Envías tu ficha de interés.', 'La coordinación revisa y aprueba tu incorporación.', 'Con tu acceso activo ingresas a la intranet y al aula virtual.'].map((item, index) => <li key={item} className="flex gap-3"><span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-emerald-500 text-xs font-extrabold text-white">{index + 1}</span><span>{item}</span></li>)}
          </ol>
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-xs leading-5 text-slate-300"><ShieldCheck className="mb-2 h-5 w-5 text-emerald-400" aria-hidden="true" />La aprobación es necesaria antes de habilitar la intranet. Si antes postulaste como socio y tu solicitud no fue aceptada, el Directorio puede incorporarte como voluntario/a permanente.</div>
          <p className="mt-6 text-xs text-slate-400">¿Quieres postular como integrante de la asociación? <Link to="/postulacion" className="font-bold text-emerald-300 underline underline-offset-2">Ir a postulación de socios</Link>.</p>
        </aside>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="border-b border-slate-100 pb-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Inscripción de voluntariado</p><h2 className="mt-2 font-['Outfit'] text-2xl font-extrabold tracking-tight sm:text-3xl">Cuéntanos cómo te gustaría aportar</h2><p className="mt-2 text-sm leading-6 text-slate-600">Los campos marcados con <span aria-hidden="true">*</span> son obligatorios. No se requiere experiencia previa.</p></header>
          {state.status === 'success' ? <div className="py-14 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden="true" /><h2 className="mt-4 font-['Outfit'] text-2xl font-extrabold">¡Postulación enviada!</h2><p role="status" className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{state.message}</p><button type="button" onClick={() => setState({ status: 'idle', message: '' })} className="mt-7 min-h-11 rounded-xl bg-slate-100 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-200">Enviar otra postulación</button></div> : <div className="space-y-7 pt-7">
            <fieldset><legend className="font-['Outfit'] text-lg font-extrabold">Datos de contacto</legend><div className="mt-4 grid gap-4 sm:grid-cols-2"><TextField label="Nombre completo" required value={form.nombreCompleto} onChange={(value) => update('nombreCompleto', value)} autoComplete="name" /><TextField label="RUT" required value={form.rut} onChange={(value) => update('rut', value)} placeholder="12.345.678-9" /><TextField label="Correo electrónico" type="email" required value={form.email} onChange={(value) => update('email', value)} autoComplete="email" /><TextField label="Teléfono" type="tel" value={form.telefono} onChange={(value) => update('telefono', value)} autoComplete="tel" /><TextField label="Región" required value={form.region} onChange={(value) => update('region', value)} /><TextField label="Comuna" value={form.comuna} onChange={(value) => update('comuna', value)} /></div></fieldset>
            <fieldset className="border-t border-slate-100 pt-7"><legend className="font-['Outfit'] text-lg font-extrabold">Experiencia y disponibilidad</legend><div className="mt-4 grid gap-4 sm:grid-cols-2"><TextField label="Profesión, oficio o especialidad" value={form.profesionEspecialidad} onChange={(value) => update('profesionEspecialidad', value)} /><label className="block text-sm font-bold text-slate-700">Disponibilidad aproximada *<select required value={form.disponibilidad} onChange={(event) => update('disponibilidad', event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"><option value="">Selecciona una opción</option><option>Menos de 4 horas al mes</option><option>4 a 8 horas al mes</option><option>Más de 8 horas al mes</option><option>Según necesidades de emergencia</option></select></label></div><TextArea label="Experiencia previa relacionada" hint="Animal, comunitaria, logística, emergencias u otra. Es opcional." value={form.experiencia} onChange={(value) => update('experiencia', value)} /></fieldset>
            <ChoiceGroup title="Áreas en las que te gustaría colaborar" options={AREAS} selected={form.areasInteres} onChange={(value) => update('areasInteres', toggle(form.areasInteres, value))} />
            <ChoiceGroup title="Recursos que podrías aportar" options={RECURSOS} selected={form.recursos} onChange={(value) => update('recursos', toggle(form.recursos, value))} />
            <TextArea label="¿Por qué quieres ser voluntario/a de PRUANED?" required value={form.motivacion} onChange={(value) => update('motivacion', value)} />
            <label className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-5 text-emerald-950"><input type="checkbox" checked={form.aceptaTerminos} onChange={(event) => update('aceptaTerminos', event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" required /><span>Autorizo el tratamiento de mis datos exclusivamente para evaluar mi postulación y gestionar mi participación como voluntario/a. *</span></label>
            {state.status === 'error' && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{state.message}</p>}
            <button type="submit" disabled={state.status === 'loading'} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-70">{state.status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Enviando postulación…</> : <><UserRoundPlus className="h-4 w-4" aria-hidden="true" />Enviar para revisión</>}</button>
          </div>}
        </form>
      </div>
    </section>
  );
}

function TextField({ label, value, onChange, required = false, type = 'text', ...props }) {
  return <label className="block text-sm font-bold text-slate-700">{label}{required && ' *'}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" {...props} /></label>;
}

function TextArea({ label, value, onChange, required = false, hint }) {
  return <label className="mt-4 block text-sm font-bold text-slate-700">{label}{required && ' *'}{hint && <span className="ml-1 font-normal text-slate-500">{hint}</span>}<textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} rows="4" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" /></label>;
}

function ChoiceGroup({ title, options, selected, onChange }) {
  return <fieldset className="border-t border-slate-100 pt-7"><legend className="font-['Outfit'] text-lg font-extrabold">{title}</legend><div className="mt-4 grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option} className={`flex min-h-11 items-center gap-3 rounded-xl border p-3 text-sm font-semibold transition ${selected.includes(option) ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><input type="checkbox" checked={selected.includes(option)} onChange={() => onChange(option)} className="h-4 w-4 accent-emerald-700" />{option}</label>)}</div></fieldset>;
}
