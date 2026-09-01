import React from 'react';
import { ArrowRight, FileCheck2, HeartHandshake, ShieldCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const pathways = [
  {
    title: 'Postula como socio',
    description: 'Participa en la asociación, fortalece la red profesional y aporta a una respuesta animal coordinada.',
    to: '/postulacion',
    action: 'Iniciar postulación',
    icon: UserPlus,
    accent: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    button: 'bg-emerald-600 hover:bg-emerald-500 focus-visible:outline-emerald-600'
  },
  {
    title: 'Súmate al voluntariado',
    description: 'Entrena, acredita tus competencias y apoya a los equipos desplegados ante emergencias.',
    to: '/postulacion-voluntariado',
    action: 'Conocer voluntariado',
    icon: HeartHandshake,
    accent: 'bg-sky-50 text-sky-700 ring-sky-100',
    button: 'bg-sky-700 hover:bg-sky-600 focus-visible:outline-sky-700'
  },
  {
    title: 'Revisa la transparencia',
    description: 'Accede a información institucional, documentos públicos y movimientos publicados por la asociación.',
    to: '/transparencia',
    action: 'Ver transparencia',
    icon: FileCheck2,
    accent: 'bg-amber-50 text-amber-700 ring-amber-100',
    button: 'bg-slate-900 hover:bg-slate-800 focus-visible:outline-slate-900'
  }
];

export const PublicPathways = () => (
  <section aria-labelledby="pathways-title" className="relative overflow-hidden bg-white py-14 sm:py-20">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-100/70 to-transparent" aria-hidden="true" />
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-800">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Participa con propósito
        </span>
        <h2 id="pathways-title" className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
          Una ruta clara para cada forma de aportar
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Elige cómo quieres vincularte con PRUANED. Cada recorrido explica qué sigue y qué información necesitas.
        </p>
      </header>

      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {pathways.map(({ title, description, to, action, icon: Icon, accent, button }) => (
          <article key={to} className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${accent}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-950">{title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
            <Link to={to} className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${button}`}>
              {action} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);
