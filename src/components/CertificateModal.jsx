import React from 'react';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { Award, ShieldCheck, QrCode, Printer } from 'lucide-react';

export const CertificateModal = ({ isOpen, onClose, certificateData }) => {
  if (!isOpen || !certificateData) return null;

  const { 
    volunteerName, 
    volunteerRut, 
    courseTitle, 
    hours, 
    hash, 
    issueDate,
    directivaPeriod = "Directiva Fundadora 2025-2029",
    presidentName = "Presidente/a del Directorio Nacional"
  } = certificateData;

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 relative border-4 border-blue-900 print:border-none print:shadow-none font-['Plus_Jakarta_Sans']">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold print:hidden"
        >
          ✕
        </button>

        {/* Certificate Frame Header */}
        <div className="text-center space-y-3 pt-2 border-b border-slate-200 pb-5">
          <div className="flex justify-center">
            <PRUANEDLogo className="h-16 w-auto" showText={true} />
          </div>
          <p className="text-[11px] text-blue-900 font-bold uppercase tracking-widest">
            Asociación Gremial de Profesionales Unidos por los Animales en Emergencias y Desastres
          </p>
          <div className="inline-block px-6 py-1 bg-blue-900 text-white font-extrabold text-lg rounded-full font-['Outfit'] shadow-md">
            CERTIFICADO OFICIAL DE ACREDITACIÓN
          </div>
        </div>

        {/* Body Copy */}
        <div className="text-center space-y-3 py-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Confiere la presente certificación de competencias a:
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] border-b-2 border-amber-400 inline-block pb-1">
            {volunteerName}
          </h2>
          <p className="text-xs font-mono font-bold text-slate-600">
            RUT / Identificación: {volunteerRut}
          </p>

          <p className="text-xs text-slate-700 leading-relaxed max-w-lg mx-auto pt-1">
            Por haber completado y aprobado con éxito la capacitación técnica en Gestión Integral del Riesgo de Desastres Animal:
          </p>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 max-w-md mx-auto">
            <h4 className="font-bold text-blue-900 text-sm font-['Outfit']">{courseTitle}</h4>
            <span className="text-[11px] text-slate-500 font-semibold">Carga Horaria: {hours} • Aprobación 100%</span>
          </div>
        </div>

        {/* President & Directiva Signatures Section */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-center">
          
          {/* President Signature Block */}
          <div className="space-y-1">
            <div className="h-12 flex items-center justify-center font-['Outfit'] italic text-blue-900 text-lg font-bold border-b border-slate-300 pb-1">
              Firma Digitalizada Presidente
            </div>
            <div className="text-xs font-bold text-slate-900">{presidentName}</div>
            <div className="text-[10px] text-slate-500 font-medium">Presidente Nacional • {directivaPeriod}</div>
          </div>

          {/* Secretary Signature Block */}
          <div className="space-y-1">
            <div className="h-12 flex items-center justify-center font-['Outfit'] italic text-slate-700 text-lg font-bold border-b border-slate-300 pb-1">
              Firma Digitalizada Secretario
            </div>
            <div className="text-xs font-bold text-slate-900">Secretaría General PRUANED</div>
            <div className="text-[10px] text-slate-500 font-medium">Timbre y Registro de Acreditación</div>
          </div>

        </div>

        {/* Verification Bar with QR Code & Hash */}
        <div className="grid grid-cols-2 gap-4 items-center bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" /> Acreditación Verificada en Línea
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              Código Hash: <span className="text-amber-400">{hash}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Emisión: {issueDate || '12/08/2026'} • Validez Nacional
            </div>
          </div>

          <div className="flex justify-end items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center">
              <QrCode className="w-10 h-10 text-slate-900" />
            </div>
          </div>
        </div>

        {/* Print Action Bar */}
        <div className="pt-1 flex justify-end gap-3 print:hidden border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrintCertificate}
            className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir / Descargar PDF
          </button>
        </div>

      </div>
    </div>
  );
};
