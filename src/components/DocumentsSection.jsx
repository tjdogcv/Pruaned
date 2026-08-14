import React, { useMemo, useState } from 'react';
import { Calendar, Download, ExternalLink, FileCheck, FileText, Loader2, LockKeyhole, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DocumentsSection = ({ visibility = 'publico' }) => {
  const { documentsList = [], docCategories = [], getDocumentDownloadUrl } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [openingDocumentId, setOpeningDocumentId] = useState(null);
  const [error, setError] = useState('');
  const isSociosRepository = visibility === 'socios';

  const documents = useMemo(() => documentsList
    .filter((document) => document.published !== false && document.visibility === visibility)
    .filter((document) => {
      const query = searchTerm.trim().toLocaleLowerCase('es-CL');
      const matchesSearch = !query || [document.title, document.description, document.category]
        .some((value) => String(value || '').toLocaleLowerCase('es-CL').includes(query));
      return matchesSearch && (selectedCategory === 'TODAS' || document.category === selectedCategory);
    }), [documentsList, searchTerm, selectedCategory, visibility]);

  const openDocument = async (document) => {
    setError('');
    setOpeningDocumentId(document.id);
    try {
      const url = await getDocumentDownloadUrl(document);
      if (!url) throw new Error('El archivo no está disponible.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (requestError) {
      setError(requestError.message || 'No fue posible abrir el documento.');
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const heading = isSociosRepository ? 'Documentos exclusivos para socios' : 'Documentos públicos y normativa gremial';
  const description = isSociosRepository
    ? 'Material interno, actas, reglamentos y comunicaciones disponibles sólo para integrantes vigentes de PRUANED A.G.'
    : 'Actas, estatutos, reglamentos, protocolos, informes y otros documentos institucionales publicados por PRUANED A.G.';

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16 font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-6">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${isSociosRepository ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}`}>
            {isSociosRepository ? <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> : <FileCheck className="h-3.5 w-3.5" aria-hidden="true" />}
            {isSociosRepository ? 'Repositorio privado de socios' : 'Repositorio documental transparente'}
          </div>
          <h2 className="mt-3 font-['Outfit'] text-3xl font-extrabold sm:text-4xl">{heading}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </header>

        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Buscar documentos</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por título, categoría o contenido" className="min-h-10 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-xs text-slate-900 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['TODAS', ...docCategories].map((category) => <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${selectedCategory === category ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{category === 'TODAS' ? 'Todas las categorías' : category}</button>)}
          </div>
        </div>

        {documents.length ? <div className="grid gap-6 md:grid-cols-2">
          {documents.map((document) => <article key={document.id} className="flex min-w-0 flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-900">{document.category}</span>
                <span className="font-mono text-[11px] font-semibold text-slate-400">{document.version} · {document.size}</span>
              </div>
              <h3 className="font-['Outfit'] text-base font-bold leading-snug text-slate-900">{document.title}</h3>
              {document.description && <p className="text-xs font-light leading-relaxed text-slate-600">{document.description}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />Publicado: {document.date || 'Sin fecha'}</span>
              <button type="button" disabled={openingDocumentId === document.id} onClick={() => openDocument(document)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow transition hover:scale-[1.02] hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">
                {openingDocumentId === document.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />}
                {openingDocumentId === document.id ? 'Abriendo…' : 'Abrir documento'} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </article>)}
        </div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><FileText className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-slate-700">No hay documentos que coincidan con tu búsqueda.</p></div>}
      </div>
    </section>
  );
};
