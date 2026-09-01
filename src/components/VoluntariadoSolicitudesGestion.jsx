import { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquareText, X, XCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APPLICATION_FIELD_GROUPS, applicationForm, displayValue, firstValue } from '../lib/volunteerPresentation';

const statusText = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada', cancelada: 'Cancelada' };
const typeText = { ingreso: 'Nueva postulación', ascenso_socio: 'Solicitud para ser socio/a', derivada_socio: 'Derivada de postulación a socio' };

export function VoluntariadoSolicitudesGestion() {
  const { canManageVoluntarios, postulacionesVoluntariadoList = [], updatePostulacionVoluntariadoEstado, updateSolicitudIngresoSocioDesdeVoluntariado } = useAuth();
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pending = useMemo(() => postulacionesVoluntariadoList.filter((item) => item.estado === 'pendiente'), [postulacionesVoluntariadoList]);
  const history = useMemo(() => postulacionesVoluntariadoList.filter((item) => item.estado !== 'pendiente').slice(0, 8), [postulacionesVoluntariadoList]);
  if (!canManageVoluntarios) return <Navigate to="/intranet/voluntarios" replace />;

  const decide = async (decision) => {
    if (!selected || saving) return;
    setSaving(true);
    setError('');
    const result = selected.tipo === 'ascenso_socio'
      ? await updateSolicitudIngresoSocioDesdeVoluntariado(selected.id, decision, 'Socio Activo', note)
      : await updatePostulacionVoluntariadoEstado(selected.id, decision, note);
    if (result?.ok) {
      setSelected(null);
      setNote('');
    } else {
      setError(result?.error?.message || 'No fue posible registrar la decisión.');
    }
    setSaving(false);
  };

  return <section aria-labelledby="volunteer-applications-title" className="space-y-5">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Incorporaciones</p><h3 id="volunteer-applications-title" className="mt-1 font-['Outfit'] text-xl font-extrabold text-slate-950">Solicitudes de voluntariado</h3><p className="mt-1 text-sm text-slate-600">Revisa la ficha completa, registra una observación y decide la incorporación.</p></div><span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{pending.length} pendientes</span></header>
    {pending.length ? <div className="grid gap-4 md:grid-cols-2">{pending.map((application) => {
      const form = applicationForm(application);
      return <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-emerald-700">{typeText[application.tipo] || application.tipo}</p><h4 className="mt-1 font-['Outfit'] text-lg font-extrabold text-slate-950">{firstValue(form, ['nombreCompleto', 'nombre'], application.email)}</h4><p className="mt-1 text-xs text-slate-500">{application.email} · {firstValue(form, ['region', 'comuna'], 'Ubicación no informada')}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">Pendiente</span></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{displayValue(firstValue(form, ['motivacion', 'experiencia']), 'Sin mensaje adicional.')}</p><button type="button" onClick={() => { setSelected(application); setNote(''); setError(''); }} className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-emerald-700 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Abrir ficha completa</button></article>;
    })}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">No hay solicitudes pendientes de voluntariado.</p>}
    {history.length > 0 && <details className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-bold text-slate-800">Ver últimas decisiones ({history.length})</summary><ul className="mt-4 divide-y divide-slate-100">{history.map((application) => <li key={application.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span><strong>{application.nombreCompleto || application.email}</strong><span className="ml-2 text-slate-500">{typeText[application.tipo] || application.tipo}</span></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{statusText[application.estado] || application.estado}</span></li>)}</ul></details>}
    {selected && <ApplicationReviewDialog application={selected} note={note} onNoteChange={setNote} saving={saving} error={error} onClose={() => setSelected(null)} onDecide={decide} />}
  </section>;
}

function ApplicationReviewDialog({ application, note, onNoteChange, saving, error, onClose, onDecide }) {
  const form = applicationForm(application);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-labelledby="review-title" className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">{typeText[application.tipo] || application.tipo}</p><h3 id="review-title" className="mt-1 font-['Outfit'] text-2xl font-extrabold text-slate-950">{firstValue(form, ['nombreCompleto', 'nombre'], application.email)}</h3><p className="mt-1 text-sm text-slate-600">{displayValue(firstValue(form, ['rut']))} · {application.email}</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" aria-label="Cerrar revisión"><X className="h-5 w-5" aria-hidden="true" /></button></header><div className="mt-6 grid gap-4 lg:grid-cols-3">{APPLICATION_FIELD_GROUPS.map((group) => <article key={group.title} className="rounded-2xl bg-slate-50 p-4"><h4 className="font-bold text-slate-900">{group.title}</h4><dl className="mt-3 space-y-3 text-sm">{group.fields.map(([label, keys]) => <Data key={label} label={label} value={firstValue(form, keys)} />)}</dl></article>)}</div><label className="mt-6 block text-sm font-bold text-slate-700"><span className="inline-flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-slate-500" aria-hidden="true" />Observación para la persona</span><textarea value={note} onChange={(event) => onNoteChange(event.target.value)} rows="3" className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="Opcional" /></label>{error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}<footer className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-700 hover:bg-slate-100">Cancelar</button><button type="button" onClick={() => onDecide('rechazar')} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300 px-4 text-sm font-bold text-rose-800 transition hover:bg-rose-50 disabled:opacity-60"><XCircle className="h-4 w-4" aria-hidden="true" />Rechazar</button><button type="button" onClick={() => onDecide('aprobar')} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-800 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}Aprobar e incorporar</button></footer></div></div>;
}

function Data({ label, value }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-800">{displayValue(value)}</dd></div>; }
