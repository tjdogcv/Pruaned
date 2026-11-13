import { useId, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';
import { BUCKET_ALIASES, openStoredDocument, uploadDocumentWithFallback } from '../lib/storage';

const formatBytes = (bytes) => {
  const num = Number(bytes);
  if (!Number.isFinite(num) || num <= 0) return '';
  if (num < 1024 * 1024) return `${Math.max(1, Math.round(num / 1024))} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const academicLabelForCondition = (condicion = '') => {
  const lower = String(condicion || '').toLowerCase();
  if (lower.includes('estudiante')) return 'Certificado de Alumno Regular vigente';
  if (lower.includes('profesional') || lower.includes('médico') || lower.includes('medico')) {
    return 'Certificado de Título profesional (o egreso)';
  }
  if (lower.includes('técnico') || lower.includes('tecnico')) {
    return 'Certificado de Título técnico o respaldo académico';
  }
  return 'Certificado de Alumno Regular (estudiantes) o Certificado de Título (profesionales/técnicos)';
};

export function VolunteerDocumentsSection({
  academicName = '',
  academicUrl = '',
  condicionAcademica = '',
  pendingByEmail = false,
  extraCerts = [],
  editable = false,
  showGuidance = false,
  allowDeferredByEmail = true,
  onAcademicChange,
  onPendingByEmailChange,
  onAddExtraCert,
  onRemoveExtraCert,
  compact = false
}) {
  const academicInputId = useId();
  const extraInputId = useId();
  const [uploadingAcademic, setUploadingAcademic] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const normalizedExtras = Array.isArray(extraCerts) ? extraCerts.filter((item) => item && (item.url || item.nombre)) : [];
  const expectedTitle = academicLabelForCondition(condicionAcademica);

  const handleAcademicFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingAcademic(true);
    setUploadError('');
    try {
      const uploaded = await uploadDocumentWithFallback(file, BUCKET_ALIASES.documentosVoluntarios, 10);
      onAcademicChange?.({
        nombre: uploaded.nombre,
        url: uploaded.url,
        pendingByEmail: false
      });
    } catch (err) {
      setUploadError(err.message || 'No se pudo subir el certificado académico.');
    } finally {
      setUploadingAcademic(false);
    }
  };

  const handleExtraFilesChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    setUploadingExtra(true);
    setUploadError('');
    try {
      for (const file of files) {
        const uploaded = await uploadDocumentWithFallback(file, BUCKET_ALIASES.documentosVoluntarios, 10);
        onAddExtraCert?.({
          id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          nombre: uploaded.nombre,
          url: uploaded.url,
          tamano: uploaded.tamano,
          fecha: uploaded.fecha
        });
      }
    } catch (err) {
      setUploadError(err.message || 'No se pudo subir una o más certificaciones adicionales.');
    } finally {
      setUploadingExtra(false);
    }
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {showGuidance && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-900">
            <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
            Documentación de respaldo requerida según tu perfil
          </div>
          <ul className="space-y-1.5 pl-1 text-[11px] leading-relaxed">
            <li>
              <strong className="font-bold">Si eres estudiante:</strong> adjunta tu{' '}
              <span className="font-semibold underline decoration-amber-400">Certificado de Alumno Regular vigente</span>.
            </li>
            <li>
              <strong className="font-bold">Si eres profesional o técnico/a:</strong> adjunta tu{' '}
              <span className="font-semibold underline decoration-amber-400">Certificado de Título</span>.
            </li>
            <li>
              <strong className="font-bold">Certificaciones extras (opcional):</strong> si cuentas con diplomados, cursos SCI, rescate animal o capacitaciones afines, puedes adjuntar 1 o más documentos aquí.
            </li>
          </ul>
          <p className="text-[11px] text-amber-800">
            Formatos permitidos: PDF, JPG, PNG o WEBP (máximo 10 MB por archivo). Si no tienes el documento a mano en este momento, marca la opción de envío posterior por correo para no frenar tu postulación.
          </p>
        </div>
      )}

      {uploadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {uploadError}
        </div>
      )}

      {/* Bloque Certificado Académico */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-800">{expectedTitle}</div>
            <p className="text-[11px] text-slate-500">
              Respaldo principal de condición académica o título profesional.
            </p>
          </div>
          {academicUrl ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Adjunto
            </span>
          ) : pendingByEmail ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
              <Mail className="w-3.5 h-3.5" /> Envío posterior por correo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
              Sin adjuntar
            </span>
          )}
        </div>

        {(academicUrl || academicName) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 truncate">
                {academicName || 'Certificado académico adjunto'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {academicUrl && (
                <button
                  type="button"
                  onClick={() => openStoredDocument(academicUrl, academicName || 'certificado_academico')}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800"
                >
                  <ExternalLink className="w-3 h-3" /> Ver documento
                </button>
              )}
              {editable && (
                <button
                  type="button"
                  onClick={() => onAcademicChange?.({ nombre: '', url: '', pendingByEmail })}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                  aria-label="Quitar certificado académico"
                >
                  <Trash2 className="w-3 h-3" /> Quitar
                </button>
              )}
            </div>
          </div>
        )}

        {editable && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label
              htmlFor={academicInputId}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 ${
                uploadingAcademic ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {uploadingAcademic ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {academicUrl ? 'Reemplazar certificado' : 'Adjuntar certificado (PDF/Imagen)'}
            </label>
            <input
              id={academicInputId}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleAcademicFileChange}
              className="hidden"
            />

            {allowDeferredByEmail && !academicUrl && (
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(pendingByEmail)}
                  onChange={(e) => onPendingByEmailChange?.(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>Enviaré este certificado luego por correo a coordinación</span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* Bloque Certificaciones Extras (1 o más documentos) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Certificaciones adicionales ({normalizedExtras.length})
            </div>
            <p className="text-[11px] text-slate-500">
              Opcional: diplomados, cursos de respuesta en emergencias, SCI, fauna silvestre u otros respaldos (puedes adjuntar 1 o más documentos).
            </p>
          </div>
          {editable && (
            <>
              <label
                htmlFor={extraInputId}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 ${
                  uploadingExtra ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {uploadingExtra ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Agregar archivo(s)
              </label>
              <input
                id={extraInputId}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleExtraFilesChange}
                className="hidden"
              />
            </>
          )}
        </div>

        {normalizedExtras.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500">
            No se han adjuntado certificaciones adicionales.
          </div>
        ) : (
          <ul className="space-y-2">
            {normalizedExtras.map((cert, index) => (
              <li
                key={cert.id || `${cert.nombre}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{cert.nombre}</div>
                    {cert.tamano ? (
                      <div className="text-[10px] text-slate-400">{formatBytes(cert.tamano)}</div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {cert.url && (
                    <button
                      type="button"
                      onClick={() => openStoredDocument(cert.url, cert.nombre)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver
                    </button>
                  )}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => onRemoveExtraCert?.(cert.id || index)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                      aria-label={`Eliminar ${cert.nombre}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
