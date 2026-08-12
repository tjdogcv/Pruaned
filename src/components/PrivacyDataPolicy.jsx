import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  UserX, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Database,
  Building,
  HelpCircle
} from 'lucide-react';

export const PrivacyDataPolicy = ({ onClose }) => {
  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 relative border border-slate-200 max-h-[90vh] overflow-y-auto font-['Plus_Jakarta_Sans']">
      
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
        >
          ✕
        </button>
      )}

      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Cumplimiento Ley N° 21.719 (Chile - Dic 2026)
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
          Política de Protección de Datos Personales & Transparencia
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Reglamento de Tratamiento de Datos, Derechos ARCO+ y Protocolo de Desvinculación de Socios y Voluntarios en PRUANED A.G.
        </p>
      </div>

      {/* Intro Alert Box */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900 space-y-2">
        <div className="font-bold text-blue-950 flex items-center gap-2 text-sm font-['Outfit']">
          <Scale className="w-4 h-4 text-blue-800" /> Marco Legal en Chile: Ley N° 21.719 sobre Protección de Datos Personales
        </div>
        <p className="leading-relaxed text-blue-800">
          La Asociación Gremial de Profesionales Unidos por los Animales en Emergencias y Desastres (PRUANED A.G.), regida por el Decreto Ley N° 2.757 de 1979, adopta de manera anticipada e integral todas las exigencias de la nueva <strong>Ley N° 21.719 de Protección de Datos Personales en Chile</strong> (vigente a partir de diciembre de 2026), garantizando los principios de licitud, finalidad, proporcionalidad, confidencialidad y seguridad.
        </p>
      </div>

      {/* Section 1: Derechos ARCO+ */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
          <Lock className="w-5 h-5 text-blue-900" />
          1. Derechos ARCO+ de los Titulares (Socios y Voluntarios)
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Todo socio o voluntario inscrito en las plataformas de PRUANED A.G. podrá ejercer en cualquier momento sus derechos normados por la Agencia de Protección de Datos Personales:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Derecho de Acceso
            </div>
            <p className="text-[11px] text-slate-600">Conocer qué datos personales están almacenados, el origen de los mismos y la finalidad de su tratamiento.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Derecho de Rectificación
            </div>
            <p className="text-[11px] text-slate-600">Solicitar la modificación o actualización de datos inexactos, desactualizados o incompletos.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Derecho de Cancelación / Supresión
            </div>
            <p className="text-[11px] text-slate-600">Solicitar la eliminación de sus datos personales cuando hayan dejado de ser necesarios para los fines institucionales.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Derecho de Oposición y Portabilidad
            </div>
            <p className="text-[11px] text-slate-600">Oponerse al tratamiento para fines no esenciales y solicitar una copia estructurada de sus datos en formato estándar.</p>
          </div>
        </div>
      </div>

      {/* Section 2: Desvinculación / Renuncia Voluntaria & Trazabilidad Inalterable */}
      <div className="space-y-4 bg-amber-50/70 border border-amber-200 p-5 rounded-2xl">
        <h3 className="text-base font-bold text-amber-950 font-['Outfit'] flex items-center gap-2">
          <UserX className="w-5 h-5 text-amber-700" />
          2. Procedimiento de Desvinculación y Retención Legal de Trazabilidad
        </h3>

        <div className="text-xs text-amber-900 space-y-3 leading-relaxed">
          <p>
            <strong>¿Qué sucede si un socio o voluntario decide desvincularse o renunciar a la asociación?</strong>
          </p>

          <div className="space-y-2 pl-2 border-l-2 border-amber-400">
            <div>
              <strong className="text-amber-950 font-semibold">a) Supresión de Datos de Contacto e Identificación Directa:</strong>
              <p className="text-[11px] text-amber-800">
                A solicitud formal del titular (escrito a <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">ag.pruaned@gmail.com</code>), su nombre completo, RUT, correo personal, domicilio, teléfono y redes sociales serán eliminados de la base activa y anonimizados en los registros generales.
              </p>
            </div>

            <div>
              <strong className="text-amber-950 font-semibold">b) Preservación Inalterable de la Trazabilidad Financiera:</strong>
              <p className="text-[11px] text-amber-800">
                Por exigencia del <strong>Decreto Ley N° 2.757 de 1979 (Ley de Asociaciones Gremiales)</strong> y normativas tributarias y de auditoría contable, los libros de Tesorería, balances, historial de cuotas pagadas, comprobantes y boletas mantendrán el registro del aporte económico realizado, reemplazando la identidad directa por una etiqueta anonimizada (ejemplo: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">[Socio Desvinculado #SOC-103]</code>). Esto evita descuadres en los balances contables de la organización.
              </p>
            </div>

            <div>
              <strong className="text-amber-950 font-semibold">c) Preservación Inalterable de la Trazabilidad Operativa en Catástrofes:</strong>
              <p className="text-[11px] text-amber-800">
                Los registros de despliegue en emergencias (horas de atención veterinaria en incendios o inundaciones, certificados QR emitidos y bitácoras técnicas) permanecerán archivados para efectos de validación ante el SENAPRED, SAG y municipalidades.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Medidas de Seguridad */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
          <Database className="w-5 h-5 text-blue-900" />
          3. Medidas de Seguridad y Cifrado
        </h3>
        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Cifrado y Autenticación Fuerte:</strong> Acceso a Intranets resguardado por autenticación de doble factor (2FA) y registro de auditoría en tiempo real.</span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Prohibición de Comercialización:</strong> PRUANED A.G. jamás venderá, cederá o transferirá datos personales a terceros comerciales.</span>
          </li>
        </ul>
      </div>

      {onClose && (
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow"
          >
            Entendido / Cerrar Política
          </button>
        </div>
      )}

    </div>
  );
};
