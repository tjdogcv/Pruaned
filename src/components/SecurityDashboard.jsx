import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Activity, Eye, AlertOctagon, Server, CheckCircle2, RefreshCw } from 'lucide-react';

export const SecurityDashboard = () => {
  const { securityLogs, currentUser } = useAuth();
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredLogs = securityLogs.filter(log => {
    if (filterSeverity === 'ALL') return true;
    return log.severity === filterSeverity;
  });

  return (
    <section className="py-16 bg-slate-950 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Módulo de Ciberseguridad & Auditoría
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
              Prevención de Vulnerabilidades & Registros (Logs)
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Monitoreo activo de autenticación, control de acceso basado en roles (RBAC) y traza de auditoría.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sistema Seguro & Cifrado
            </span>
          </div>
        </div>

        {/* Security KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Cifrado de Sesión</span>
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-['Outfit']">AES-256 Bit</div>
            <p className="text-xs text-slate-500">Tokens firmados con expiración automática</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Autenticación 2FA</span>
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-['Outfit']">Activa</div>
            <p className="text-xs text-slate-500">Código OTP requerido en cada login</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Sanitización XSS</span>
              <Server className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-['Outfit']">Protegida</div>
            <p className="text-xs text-slate-500">Filtro de entradas contra script injection</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Eventos Auditados</span>
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 font-['Outfit']">{securityLogs.length}</div>
            <p className="text-xs text-slate-500">Historial imborrable de seguridad</p>
          </div>
        </div>

        {/* Security Logs Audit Trail Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Traza de Auditoría de Ciberseguridad (Security Audit Log)
            </h3>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              {['ALL', 'INFO', 'WARN', 'ERROR'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterSeverity === sev
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">IP Origen</th>
                  <th className="py-3 px-4">Evento de Seguridad</th>
                  <th className="py-3 px-4">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300">{log.date}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{log.user}</td>
                    <td className="py-3.5 px-4 text-slate-400">{log.ip}</td>
                    <td className="py-3.5 px-4 text-white font-sans">{log.event}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-sans font-bold text-[10px] ${
                        log.severity === 'INFO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        log.severity === 'WARN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};
