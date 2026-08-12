import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  UserX, 
  CheckCircle2, 
  Scale, 
  Database,
  Building,
  BookOpen,
  Info
} from 'lucide-react';

export const PrivacyDataPolicy = ({ onClose }) => {
  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 relative border border-slate-200 max-h-[90vh] overflow-y-auto font-['Plus_Jakarta_Sans'] text-xs">
      
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
          <Scale className="w-4 h-4 text-blue-800" />
          Harmonización Legal: Decreto Ley 2.757 & Ley N° 21.719
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
          Reglamento de Registros de Socios & Protección de Datos
        </h2>
        <p className="text-slate-600 mt-1">
          Ajuste normativo entre la obligación legal de Padrón Gremial (DL 2.757) y la Ley de Protección de Datos Personales en Chile.
        </p>
      </div>

      {/* Direct Legal Explanation Box */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl space-y-3 shadow-md border border-slate-800">
        <div className="font-bold text-amber-400 flex items-center gap-2 text-sm font-['Outfit']">
          <BookOpen className="w-5 h-5 text-amber-400" /> ¿Cómo se ajusta la ley de asociaciones gremiales con la protección de datos?
        </div>
        <p className="text-slate-300 leading-relaxed">
          Existe una perfecta armonía legal entre el <strong>Decreto Ley N° 2.757 de 1979</strong> (que regula la constitución y funcionamiento de las Asociaciones Gremiales en Chile) y la nueva <strong>Ley N° 21.719 sobre Protección de Datos Personales</strong> (vigente desde diciembre de 2026).
        </p>
      </div>

      {/* 2 Column Comparison: DL 2757 vs Ley 21.719 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Col 1: Decreto Ley 2.757 */}
        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 space-y-3">
          <h3 className="font-bold text-blue-950 text-sm font-['Outfit'] flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-800" /> Exigencia DL N° 2.757 (Asociaciones Gremiales)
          </h3>
          <ul className="space-y-2 text-blue-900">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-950">•</span>
              <span><strong>Obligación de Padrón Histórico:</strong> El Art. 10 del DL 2.757 exige llevar un registro oficial de <i>Socios Activos</i> y <i>Socios Pasados/Desvinculados</i>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-950">•</span>
              <span><strong>Fiscalización del Ministerio de Economía:</strong> El Directorio debe mantener la trazabilidad de fechas de ingreso, renuncia, cuotas y asistencia a Asambleas para validar quorum legal y memorias anuales.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-950">•</span>
              <span><strong>Obligación Tributaria (SII):</strong> Los aportes de cuotas ordinarias e incorporación deben auditarse sin alteraciones en los libros de Tesorería.</span>
            </li>
          </ul>
        </div>

        {/* Col 2: Ley 21.719 Excepciones Legal */}
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
          <h3 className="font-bold text-emerald-950 text-sm font-['Outfit'] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Excepción Legal Ley N° 21.719 (Art. 13 y 16)
          </h3>
          <ul className="space-y-2 text-emerald-900">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-950">•</span>
              <span><strong>Prevalencia de la Obligación Legal:</strong> La Ley 21.719 establece expresamente que el <i>Derecho de Supresión / Olvido</i> NO aplica cuando exista una obligación legal imperativa de conservación de datos impuesta por otra ley de la República.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-950">•</span>
              <span><strong>Bloqueo y Anonimización:</strong> Los datos personales privados (teléfono, correo personal, domicilio) son bloqueados/eliminados, mientras que la constancia gremial histórica queda archivada con acceso restringido.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Section 3: Protocolo Técnico en la Plataforma PRUANED A.G. */}
      <div className="space-y-4 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-900" />
          Implementación Técnica del Registro Doble (Socios Activos vs Pasados)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 font-['Outfit'] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Registro de Socios Activos (Vigentes)
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Mantiene la totalidad de antecedentes (*Nombre, RUT, Correo, Teléfono, Comuna, Profesión, Estado de Cuotas y Certificados QR*) para el ejercicio de derechos sociales, voto en Asambleas y despliegues en desastres.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-amber-900 font-['Outfit'] flex items-center gap-1.5">
              <UserX className="w-4 h-4 text-amber-600" /> Registro de Socios Pasados (Desvinculados)
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Padrón Histórico Reservado (DL 2.757):</strong> Conserva únicamente en archivo privado del Directorio la constancia institucional de pertenencia (*Nombre, RUT, Fecha Ingreso, Fecha Retiro y Motivo de Baja*).<br/>
              <strong>Bloqueo de Contacto (Ley 21.719):</strong> Teléfono, correo personal y domicilio son borrados. Los registros de cuotas en Tesorería y bitácoras de desastres se preservan anonimizados (`[SOC-103]`).
            </p>
          </div>
        </div>
      </div>

      {onClose && (
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow"
          >
            Cerrar Explicación Legal
          </button>
        </div>
      )}

    </div>
  );
};
