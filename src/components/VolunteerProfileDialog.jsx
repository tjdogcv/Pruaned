import { KeyRound, MailCheck, MapPin, UserRound, X } from 'lucide-react';
import { APPLICATION_FIELD_GROUPS, accessStatus, displayValue, firstValue, formatDate, volunteerForm } from '../lib/volunteerPresentation';

const toneClasses = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-950',
  rose: 'border-rose-200 bg-rose-50 text-rose-900',
  slate: 'border-slate-200 bg-slate-50 text-slate-800'
};

export function VolunteerProfileDialog({ volunteer, hasAccount, onClose }) {
  if (!volunteer) return null;
  const form = volunteerForm(volunteer);
  const access = accessStatus(volunteer, hasAccount);
  const inviteDate = formatDate(access.sentAt);
  const expiryDate = formatDate(access.expiresAt);
  const hasApplicationData = Boolean(volunteer.datosPostulacion?.formulario || volunteer.datos_postulacion?.formulario);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <div role="dialog" aria-modal="true" aria-labelledby="volunteer-record-title" className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Ficha de voluntariado</p><h3 id="volunteer-record-title" className="mt-1 font-['Outfit'] text-2xl font-extrabold text-slate-950">{firstValue(form, ['nombre', 'nombreCompleto'], volunteer.email)}</h3><p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-600"><span>{firstValue(form, ['rut'], 'RUT no informado')}</span><span aria-hidden="true">·</span><span>{volunteer.email || 'Correo no informado'}</span></p></div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 flex-none place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" aria-label="Cerrar ficha de voluntario"><X className="h-5 w-5" aria-hidden="true" /></button>
      </header>

      <section className={`mt-5 rounded-2xl border p-4 ${toneClasses[access.tone]}`} aria-label="Estado de acceso"><div className="flex items-start gap-3"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white/70"><KeyRound className="h-5 w-5" aria-hidden="true" /></span><div><p className="font-bold">{access.label}</p><p className="mt-1 text-sm leading-6">{access.detail}</p>{(inviteDate || expiryDate) && <p className="mt-2 text-xs font-semibold">{inviteDate ? `Invitación enviada: ${inviteDate}` : ''}{inviteDate && expiryDate ? ' · ' : ''}{expiryDate ? `Vence: ${expiryDate}` : ''}</p>}</div></div></section>

      <section className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3"><RecordItem icon={UserRound} label="Estado operativo" value={volunteer.estadoOperativo || volunteer.estado || 'Activo'} /><RecordItem icon={MapPin} label="Región" value={firstValue(form, ['region'], volunteer.region)} /><RecordItem icon={MailCheck} label="Disponibilidad" value={firstValue(form, ['disponibilidadRespuesta', 'disponibilidad', 'tiempoDisponible'])} /></section>

      {hasApplicationData ? <section className="mt-6"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Antecedentes de postulación</p><h4 className="mt-1 font-['Outfit'] text-xl font-extrabold text-slate-950">Ficha completa enviada</h4><p className="mt-1 text-sm text-slate-600">Datos conservados desde el formulario de incorporación.</p></div><div className="mt-4 grid gap-4 lg:grid-cols-3">{APPLICATION_FIELD_GROUPS.map((group) => <article key={group.title} className="rounded-2xl border border-slate-200 bg-white p-4"><h5 className="font-bold text-slate-900">{group.title}</h5><dl className="mt-3 space-y-3">{group.fields.map(([label, keys]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap leading-5 text-slate-800">{displayValue(firstValue(form, keys))}</dd></div>)}</dl></article>)}</div></section> : <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">Esta ficha no tiene un formulario de postulación histórico asociado. Puedes completar los antecedentes operativos a medida que se actualice el padrón.</p>}

      <footer className="mt-7 flex justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">Cerrar ficha</button></footer>
    </div>
  </div>;
}

function RecordItem({ icon: Icon, label, value }) {
  return <div><Icon className="h-4 w-4 text-emerald-700" aria-hidden="true" /><p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-bold leading-5 text-slate-900">{displayValue(value)}</p></div>;
}
