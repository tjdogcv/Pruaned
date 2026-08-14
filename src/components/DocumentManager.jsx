import { useMemo, useState } from 'react';
import { Archive, ExternalLink, FileText, FileUp, Loader2, RotateCcw, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const initialForm = (categories) => ({
  title: '',
  category: categories[0] || '',
  description: '',
  version: 'v1.0',
  visibility: 'publico',
  file: null
});

export function DocumentManager() {
  const { docCategories = [], documentsList = [], addDocument, archiveDocument, restoreDocument, getDocumentDownloadUrl } = useAuth();
  const [form, setForm] = useState(() => initialForm(docCategories));
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [busyDocumentId, setBusyDocumentId] = useState(null);
  const [openingDocumentId, setOpeningDocumentId] = useState(null);

  const documents = useMemo(
    () => [...documentsList].sort((first, second) => String(second.date || '').localeCompare(String(first.date || ''))),
    [documentsList]
  );
  const publishedCount = documents.filter((document) => document.published).length;

  const resetForm = () => setForm(initialForm(docCategories));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!form.file) {
      setError('Selecciona un archivo PDF, DOCX o XLSX para publicar.');
      return;
    }

    setIsSaving(true);
    try {
      const document = await addDocument(form);
      setNotice(`“${document.title}” fue publicado para ${document.visibility === 'socios' ? 'socios' : 'todo público'}.`);
      resetForm();
    } catch (requestError) {
      setError(requestError.message || 'No fue posible publicar el documento.');
    } finally {
      setIsSaving(false);
    }
  };

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

  const togglePublication = async (document) => {
    setError('');
    setNotice('');
    setBusyDocumentId(document.id);
    try {
      if (document.published) {
        await archiveDocument(document.id);
        setNotice(`“${document.title}” fue retirado de la lista pública sin borrar su registro.`);
      } else {
        await restoreDocument(document.id);
        setNotice(`“${document.title}” volvió a publicarse.`);
      }
    } catch (requestError) {
      setError(requestError.message || 'No fue posible actualizar la publicación.');
    } finally {
      setBusyDocumentId(null);
    }
  };

  return (
    <section className="space-y-7 animate-fade-in">
      <div className="flex flex-col gap-3 border-b border-slate-700 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Repositorio institucional</p>
          <h3 className="mt-2 font-['Outfit'] text-2xl font-extrabold text-white">Documentos publicados</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Publica documentos abiertos o exclusivos para socios. Los documentos retirados conservan su registro y pueden restaurarse.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
          <FileText className="h-4 w-4" aria-hidden="true" /> {publishedCount} publicados
        </span>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">{notice}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-700 bg-slate-800/90 p-5 shadow-xl sm:p-7">
          <div>
            <h4 className="inline-flex items-center gap-2 font-['Outfit'] text-lg font-extrabold text-white"><Upload className="h-5 w-5 text-emerald-300" aria-hidden="true" />Publicar documento</h4>
            <p className="mt-1 text-xs leading-5 text-slate-400">PDF, DOCX o XLSX, hasta 20 MB. El archivo quedará disponible en el repositorio documental público.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" required className="sm:col-span-2">
              <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="document-input" placeholder="Acta Asamblea Ordinaria 2026" />
            </Field>
            <Field label="Categoría" required>
              <select required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="document-input">
                <option value="" disabled>Selecciona una categoría</option>
                {docCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="Versión">
              <input value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} className="document-input" placeholder="v1.0" />
            </Field>
            <Field label="Visibilidad" required>
              <select required value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))} className="document-input">
                <option value="publico">Público</option>
                <option value="socios">Sólo socios</option>
              </select>
            </Field>
            <Field label="Descripción" className="sm:col-span-2">
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="document-input resize-y" rows="3" placeholder="Indica el contenido y vigencia del documento." />
            </Field>
          </div>

          <label className="block rounded-xl border border-dashed border-slate-600 bg-slate-950/40 p-4 text-sm text-slate-300 transition hover:border-emerald-400/60">
            <span className="flex items-center gap-2 font-bold text-white"><FileUp className="h-5 w-5 text-emerald-300" aria-hidden="true" />{form.file ? form.file.name : 'Seleccionar archivo'}</span>
            <span className="mt-1 block text-xs text-slate-400">{form.file ? `${(form.file.size / (1024 * 1024)).toFixed(1)} MB` : 'PDF, DOCX o XLSX · máximo 20 MB'}</span>
            <input type="file" accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} />
          </label>

          <button disabled={isSaving} type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-wait disabled:opacity-60">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            {isSaving ? 'Publicando…' : 'Publicar documento'}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-slate-700 bg-slate-800/70 p-5 text-sm text-slate-300 shadow-xl">
          <h4 className="font-['Outfit'] text-lg font-extrabold text-white">Reglas de publicación</h4>
          <ul className="mt-4 space-y-3 leading-6 text-slate-400">
            <li>Usa una versión y descripción que permitan identificar el documento vigente.</li>
            <li>“Sólo socios” se almacena en un repositorio privado y no se muestra en el portal público.</li>
            <li>Retirar un documento lo oculta de sus listados sin borrar el historial.</li>
            <li>Para crear categorías nuevas, utiliza la pestaña “Categorías de Documentos”.</li>
          </ul>
        </aside>
      </div>

      <div className="space-y-3">
        <h4 className="font-['Outfit'] text-xl font-extrabold text-white">Catálogo editorial</h4>
        {documents.length ? documents.map((document) => (
          <article key={document.id} className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-800/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-200">{document.category}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${document.visibility === 'socios' ? 'bg-amber-400/10 text-amber-200' : 'bg-sky-400/10 text-sky-200'}`}>{document.visibility === 'socios' ? 'Sólo socios' : 'Público'}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${document.published ? 'bg-emerald-400/10 text-emerald-200' : 'bg-slate-600/50 text-slate-300'}`}>{document.published ? 'Publicado' : 'Retirado'}</span></div>
              <h5 className="mt-2 truncate font-bold text-white">{document.title}</h5>
              <p className="mt-1 text-xs text-slate-400">{document.version} · {document.size} · {document.date || 'Sin fecha'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={openingDocumentId === document.id} onClick={() => openDocument(document)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-600 px-3 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"><ExternalLink className="h-4 w-4" aria-hidden="true" />{openingDocumentId === document.id ? 'Abriendo…' : 'Abrir'}</button>
              <button type="button" disabled={busyDocumentId === document.id} onClick={() => togglePublication(document)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-600 px-3 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
                {busyDocumentId === document.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : document.published ? <Archive className="h-4 w-4" aria-hidden="true" /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}
                {document.published ? 'Retirar' : 'Restaurar'}
              </button>
            </div>
          </article>
        )) : <p className="rounded-2xl border border-dashed border-slate-600 p-5 text-sm text-slate-400">Aún no hay documentos publicados.</p>}
      </div>
    </section>
  );
}

function Field({ label, required, className = '', children }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-bold text-slate-300">{label}{required && <span aria-hidden="true"> *</span>}</span>{children}</label>;
}
