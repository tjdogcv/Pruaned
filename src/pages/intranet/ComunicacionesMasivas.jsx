import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendMassivoEmail } from '../../lib/emailMasivo';
import {
  Mail, Send, Users, AlertCircle, CheckCircle2,
  Search, Filter, X, ChevronDown, Loader2
} from 'lucide-react';

const CATEGORIAS = ['Todas', 'Socio Activo', 'Socio Adherente', 'Socio Honorario', 'Estudiante/Pasante'];
const ESTADOS = ['Todos', 'Al Día', 'Moroso/Deudor', 'Suspendido', 'Desvinculado / Retiro Aprobado DL 2757'];

export default function ComunicacionesMasivas() {
  const { isMasterUser, isDirectiva, sociosList = [], voluntariosList = [] } = useAuth();
  if (!isMasterUser && !isDirectiva) return <Navigate to="/intranet/dashboard" replace />;

  // Filtros de destinatarios
  const [targetGroup, setTargetGroup] = useState('socios');
  const [filterCategoria, setFilterCategoria] = useState('Todas');
  const [filterEstado, setFilterEstado] = useState('Al Día');
  const [searchDest, setSearchDest] = useState('');

  // Mensaje
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Estado envío
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const destinatarios = useMemo(() => {
    let list = [];
    if (targetGroup === 'socios' || targetGroup === 'morosos') {
      list = sociosList.filter(s => {
        if (targetGroup === 'morosos') return s.estadoCuota?.toLowerCase().includes('moroso') || s.estadoCuota?.toLowerCase().includes('deudor');
        if (filterCategoria !== 'Todas' && s.categoria !== filterCategoria) return false;
        if (filterEstado !== 'Todos' && s.estadoCuota !== filterEstado) return false;
        return true;
      });
    } else if (targetGroup === 'voluntarios') {
      list = voluntariosList;
    }
    if (searchDest.trim()) {
      const q = searchDest.toLowerCase();
      list = list.filter(r => (r.nombre || r.nombreCompleto || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q));
    }
    // Normalize to { id, nombre, email }
    return list.map(r => ({
      id: r.id,
      nombre: r.nombre || r.nombreCompleto || '',
      email: r.email || ''
    })).filter(r => r.email && !r.email.includes('anonimizado'));
  }, [targetGroup, filterCategoria, filterEstado, searchDest, sociosList, voluntariosList]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (destinatarios.length === 0) { alert('No hay destinatarios seleccionados.'); return; }
    if (!window.confirm(`Enviar correo a ${destinatarios.length} destinatario(s)?`)) return;

    setIsSending(true);
    setResult(null);
    setProgress({ current: 0, total: destinatarios.length });

    try {
      const res = await sendMassivoEmail(
        destinatarios,
        subject.trim(),
        body.trim(),
        (current, total) => setProgress({ current, total })
      );
      setResult(res);
    } catch (err) {
      setResult({ sent: 0, failed: destinatarios.length, errors: [{ email: 'general', error: err.message }] });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div>
        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase tracking-wider">Comunicaciones Gremiales</span>
        <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-900" /> Correos Masivos
        </h2>
        <p className="text-sm text-slate-500 mt-1">Envía comunicaciones oficiales a socios, morosos o voluntarios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --- PANEL DESTINATARIOS --- */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-blue-700" /> Destinatarios
          </h3>

          {/* Grupo */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'socios', label: 'Socios por categoría / estado' },
              { id: 'morosos', label: 'Solo morosos' },
              { id: 'voluntarios', label: 'Voluntarios' }
            ].map(g => (
              <button key={g.id} type="button" onClick={() => { setTargetGroup(g.id); setResult(null); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${targetGroup === g.id ? 'bg-blue-900 text-white border-blue-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Filtros para socios */}
          {targetGroup === 'socios' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Categoría</label>
                <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 outline-none">
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Estado de Cuota</label>
                <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 outline-none">
                  {ESTADOS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={searchDest} onChange={e => setSearchDest(e.target.value)}
              placeholder="Filtrar por nombre o email..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400" />
          </div>

          {/* Lista de destinatarios */}
          <div className="border border-slate-100 rounded-2xl max-h-72 overflow-y-auto divide-y divide-slate-50">
            {destinatarios.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Sin destinatarios con los filtros actuales.</p>
            ) : destinatarios.slice(0, 50).map(d => (
              <div key={d.id} className="flex items-center gap-2 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-[10px] flex-shrink-0">
                  {(d.nombre || d.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{d.nombre || '—'}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{d.email}</p>
                </div>
              </div>
            ))}
            {destinatarios.length > 50 && (
              <p className="text-center text-[10px] text-slate-500 py-2">…y {destinatarios.length - 50} más</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 bg-blue-50 rounded-xl px-4 py-2.5">
            <Users className="w-3.5 h-3.5" /> Total: {destinatarios.length} destinatario(s)
          </div>
        </div>

        {/* --- PANEL MENSAJE --- */}
        <form onSubmit={handleSend} className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
            <Mail className="w-4 h-4 text-blue-700" /> Redactar mensaje
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Asunto del correo *</label>
            <input type="text" required value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Ej: Recordatorio de cuotas pendientes — PRUANED A.G."
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 bg-slate-50" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cuerpo del mensaje *</label>
            <textarea required rows={12} value={body} onChange={e => setBody(e.target.value)}
              placeholder="Estimado/a [nombre],&#10;&#10;Escribe aquí el contenido oficial de tu comunicación...&#10;&#10;Atentamente,&#10;Directorio Nacional PRUANED A.G."
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 bg-slate-50 resize-none font-mono" />
            <p className="text-[10px] text-slate-400 mt-1">Tip: usa el texto tal cual. EmailJS insertará el nombre del destinatario si tu template incluye <code>to_name</code>.</p>
          </div>

          {/* Barra de progreso durante envío */}
          {isSending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold"><Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Enviando...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className={`rounded-2xl p-4 border ${result.failed === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className="font-bold text-sm flex items-center gap-1.5">
                {result.failed === 0
                  ? <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Todos los correos enviados</>
                  : <><AlertCircle className="w-4 h-4 text-amber-600" /> Envío completado con advertencias</>}
              </p>
              <p className="text-xs mt-1 text-slate-700">✓ Enviados: <strong>{result.sent}</strong> &nbsp;✗ Fallidos: <strong>{result.failed}</strong></p>
              {result.errors.length > 0 && (
                <details className="mt-2 text-xs text-slate-500">
                  <summary className="cursor-pointer font-semibold text-amber-800">Ver errores</summary>
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.map((e, i) => <li key={i} className="font-mono">{e.email}: {e.error}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setPreviewOpen(true)} disabled={!subject || !body}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              Vista previa
            </button>
            <button type="submit" disabled={isSending || destinatarios.length === 0 || !subject || !body}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow disabled:opacity-40 flex items-center gap-2">
              {isSending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                : <><Send className="w-3.5 h-3.5" /> Enviar a {destinatarios.length} destinatario(s)</>}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: Vista previa */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-lg font-['Outfit']">Vista previa del correo</h4>
              <button onClick={() => setPreviewOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <p className="text-xs text-slate-500"><strong>Para:</strong> {destinatarios.slice(0, 3).map(d => d.email).join(', ')}{destinatarios.length > 3 ? ` y ${destinatarios.length - 3} más…` : ''}</p>
              <p className="text-xs text-slate-500"><strong>Asunto:</strong> {subject}</p>
              <hr />
              <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans">{body}</pre>
            </div>
            <div className="text-right">
              <button onClick={() => setPreviewOpen(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
