import React, { useRef } from 'react';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { ShieldCheck, Printer, X, UserCheck, CheckCircle2 } from 'lucide-react';

export const CredencialDigitalModal = ({ socio, onClose }) => {
  if (!socio) return null;

  const handlePrint = () => {
    window.print();
  };

  const rutFormatted = socio.rut || 'No informado';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://pruaned.cl/verificar/PRU-SOC-${socio.rut || socio.id}`)}&color=0f172a&bgcolor=ffffff`;

  const initials = socio.nombre
    ? socio.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'SO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative border border-slate-200">
        
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-full uppercase tracking-wider">
            Acreditación Operativa
          </span>
          <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" /> Credencial Oficial de Socio
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Identificación oficial para operativos en terreno, emergencias y eventos gremiales.
          </p>
        </div>

        {/* --- TARJETA DE CREDENCIAL IMPRIMIBLE --- */}
        <div id="printable-credential" className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700 relative overflow-hidden space-y-5">
          
          {/* Header de la tarjeta */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-white p-1 rounded-lg">
                <PRUANEDLogo className="h-6 w-auto" showText={false} />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 leading-none">PRUANED A.G.</div>
                <div className="text-xs font-bold text-slate-300">Asociación Gremial Nacional</div>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              Socio Activo
            </span>
          </div>

          {/* Cuerpo: Foto + Datos + QR */}
          <div className="flex items-center gap-4">
            {/* Foto de perfil */}
            <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-800 border-2 border-emerald-500 flex-shrink-0 flex items-center justify-center">
              {socio.fotoPerfil ? (
                <img src={socio.fotoPerfil} alt={socio.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-emerald-400">{initials}</span>
              )}
            </div>

            {/* Datos */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-sm font-bold text-white leading-snug truncate">
                {socio.nombre}
              </div>
              <div className="text-xs text-slate-300 font-mono font-bold">
                RUT: {rutFormatted}
              </div>
              <div className="text-[11px] text-emerald-300 truncate">
                {socio.profesion || 'Profesional Socio'}
              </div>
              <div className="text-[10px] text-slate-400">
                Región: {socio.region || 'Chile'}
              </div>
            </div>

            {/* Código QR */}
            <div className="w-20 h-20 bg-white p-1 rounded-xl flex-shrink-0 flex flex-col items-center justify-center shadow">
              <img src={qrUrl} alt="QR Verificación" className="w-16 h-16" />
              <span className="text-[7px] font-extrabold text-slate-900 tracking-tighter">VERIFICAR</span>
            </div>
          </div>

          {/* Footer de la tarjeta */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400">
            <span>Registro: PRU-SOC-{socio.id?.slice(0, 8) || '2026'}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3 h-3" /> {socio.estadoCuota || 'Al Día'}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </button>
        </div>

      </div>
    </div>
  );
};
