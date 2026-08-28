import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Download, Search, ClipboardList } from 'lucide-react';

const SEVERITY_CFG = {
  INFO:  { color: 'bg-blue-100 text-blue-800 border-blue-200',    dot: 'bg-blue-500',   label: 'Info' },
  WARN:  { color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500',  label: 'Alerta' },
  ERROR: { color: 'bg-rose-100 text-rose-800 border-rose-200',    dot: 'bg-rose-500',   label: 'Error' },
};

const AuditoriaPanel = ({ securityLogs = [] }) => {
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverity, setAuditSeverity] = useState('TODAS');
  const [auditUser, setAuditUser] = useState('TODOS');

  const uniqueUsers = [...new Set(securityLogs.map(l => l.user))].sort();

  const filteredLogs = securityLogs.filter(log => {
    const matchSearch = auditSearch.trim() === '' ||
      (log.label || log.event).toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.date.includes(auditSearch);
    const matchSeverity = auditSeverity === 'TODAS' || log.severity === auditSeverity;
    const matchUser = auditUser === 'TODOS' || log.user === auditUser;
    return matchSearch && matchSeverity && matchUser;
  });

  const handleExportCSV = () => {
    const headers = 'Fecha/Hora,Usuario,Acción,Código Técnico,Severidad\n';
    const rows = filteredLogs.map(l =>
      `"${l.date}","${l.user}","${l.label || l.event}","${l.event}","${l.severity}"`
    ).join('\n');
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([headers + rows], { type: 'text/csv;charset=utf-8' }));
    el.download = `Auditoria_PRUANED_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <span className="px-2.5 py-0.5 bg-violet-100 text-violet-900 font-bold text-[10px] rounded-full uppercase">
              Trazabilidad de Cambios
            </span>
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-700" />
              Registro de Auditoría Institucional
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historial completo de acciones — quién hizo cada cambio y cuándo.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-violet-900 hover:bg-violet-800 text-white text-xs font-bold rounded-xl shadow transition-colors flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar acción, usuario o fecha..."
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-violet-400"
            />
          </div>
          <select
            value={auditSeverity}
            onChange={e => setAuditSeverity(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 font-semibold outline-none"
          >
            <option value="TODAS">Todas las severidades</option>
            <option value="INFO">Info</option>
            <option value="WARN">Alerta</option>
            <option value="ERROR">Error</option>
          </select>
          <select
            value={auditUser}
            onChange={e => setAuditUser(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 font-semibold outline-none max-w-[220px]"
          >
            <option value="TODOS">Todos los usuarios</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span className="text-[11px] text-slate-400 font-mono ml-auto">
            {filteredLogs.length} / {securityLogs.length} eventos
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{sev:'INFO',label:'Operaciones',icon:'🔵'},{sev:'WARN',label:'Alertas',icon:'🟡'},{sev:'ERROR',label:'Errores',icon:'🔴'}].map(({sev,label,icon}) => (
          <div key={sev} className={`p-4 rounded-2xl border text-xs font-bold ${SEVERITY_CFG[sev]?.color}`}>
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-2xl font-extrabold font-['Outfit']">{securityLogs.filter(l => l.severity === sev).length}</div>
            <div className="opacity-70">{label}</div>
          </div>
        ))}
        <div className="p-4 rounded-2xl border text-xs font-bold bg-slate-100 text-slate-800 border-slate-200">
          <div className="text-lg mb-1">📋</div>
          <div className="text-2xl font-extrabold font-['Outfit']">{securityLogs.length}</div>
          <div className="opacity-70">Total registros</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Acción</th>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Severidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic">
                    No se encontraron eventos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const cfg = SEVERITY_CFG[log.severity] || SEVERITY_CFG.INFO;
                  return (
                    <tr key={log.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{log.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 truncate max-w-[200px]">{log.user}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{log.label || log.event}</div>
                        {log.label && log.event !== log.label && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.event}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredLogs.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Mostrando {filteredLogs.length} evento{filteredLogs.length !== 1 ? 's' : ''}</span>
            <span>Los registros se sincronizan con el historial de auditoría institucional.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AuditoriaLogs() {
  const { isMasterUser, isDirectiva, securityLogs } = useAuth();

  if (!isMasterUser && !isDirectiva) return <Navigate to="/intranet/dashboard" replace />;

  return (
    <section className="min-h-screen bg-slate-50 py-2 text-slate-900 font-['Plus_Jakarta_Sans']">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-slate-200 pb-0">
          <div className="max-w-2xl pb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Control institucional</p>
            <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Registro de auditoría</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Revisa la actividad relevante de la intranet.</p>
          </div>
          
          <nav className="flex gap-1 overflow-x-auto" aria-label="Opciones de Registro de auditoría">
            <button
              type="button"
              aria-current="page"
              className="inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 border-blue-700 text-blue-800"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Actividad institucional
            </button>
          </nav>
        </header>
        
        <AuditoriaPanel securityLogs={securityLogs || []} />
      </div>
    </section>
  );
}
