import React from 'react';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { Award, Printer, X, ShieldCheck } from 'lucide-react';

export const CertificadoAfiliacionModal = ({ socio, onClose }) => {
  if (!socio) return null;

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://pruaned.cl/verificar/PRU-SOC-${socio.rut || socio.id}`)}&color=0f172a&bgcolor=ffffff`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-10 space-y-6 relative border border-slate-200 max-h-[95vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase tracking-wider">
              Documento Oficial
            </span>
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-800" /> Certificado de Afiliación Gremial
            </h3>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>

        {/* --- CONTENIDO DEL CERTIFICADO --- */}
        <div className="p-8 sm:p-12 bg-slate-50 rounded-2xl border-2 border-slate-300 text-slate-900 space-y-8 relative font-serif">
          
          {/* Encabezado */}
          <div className="text-center space-y-2 border-b border-slate-300 pb-6">
            <div className="flex justify-center mb-2">
              <PRUANEDLogo className="h-16 w-auto" showText={false} />
            </div>
            <h2 className="text-lg font-bold tracking-widest uppercase text-slate-900 font-sans">
              Asociación Gremial de Profesionales de Respuesta a Emergencias y Desastres
            </h2>
            <p className="text-xs text-slate-600 font-sans tracking-wide">
              PRUANED A.G. — Constituida conforme al Decreto Ley N° 2.757 de 1979
            </p>
          </div>

          {/* Título Principal */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-['Outfit']">
              CERTIFICADO DE SOCIO ACTIVO
            </h1>
            <p className="text-xs text-slate-500 font-sans font-mono">
              Código de Verificación: PRU-SOC-{socio.rut || socio.id?.slice(0, 8)}
            </p>
          </div>

          {/* Texto del Certificado */}
          <div className="text-sm leading-relaxed text-slate-800 space-y-4 font-sans text-justify">
            <p>
              El Directorio Nacional de la <strong>Asociación Gremial de Profesionales de Respuesta a Emergencias y Desastres (PRUANED A.G.)</strong> certifica que:
            </p>
            
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-1 my-4">
              <div className="text-lg font-extrabold text-blue-950 font-['Outfit']">
                {socio.nombre}
              </div>
              <div className="text-xs text-slate-600 font-mono font-bold">
                Cédula de Identidad (RUT): {socio.rut || 'No informado'}
              </div>
              <div className="text-xs text-slate-500">
                Profesión: {socio.profesion || 'Profesional'}
              </div>
            </div>

            <p>
              Se encuentra formalmente inscrito/a en el <strong>Padrón Oficial de Socios de PRUANED A.G.</strong> bajo la categoría de <strong>{socio.categoria || 'Socio Activo'}</strong>, con estado gremial <strong>{socio.estadoCuota || 'Al Día'}</strong> y con plenos derechos conforme a los estatutos vigentes de la asociación.
            </p>
            <p>
              Se extiende el presente certificado a petición del interesado/a para los fines que estime pertinentes, en la ciudad de Santiago de Chile, a <strong>{today}</strong>.
            </p>
          </div>

          {/* Firmas y QR */}
          <div className="pt-8 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans">
            <div className="text-center space-y-1">
              <div className="w-40 border-b border-slate-800 pb-8 text-xs font-bold text-slate-900">
                Firma Presidente Nacional
              </div>
              <div className="text-[10px] text-slate-500">PRUANED A.G.</div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <img src={qrUrl} alt="QR Validación" className="w-24 h-24" />
              <span className="text-[8px] font-bold text-slate-600 mt-1 font-mono">Validación SENAPRED/SAG</span>
            </div>

            <div className="text-center space-y-1">
              <div className="w-40 border-b border-slate-800 pb-8 text-xs font-bold text-slate-900">
                Firma Secretario Nacional
              </div>
              <div className="text-[10px] text-slate-500">PRUANED A.G.</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
