import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X
} from 'lucide-react';
import {
  buildCredentialData,
  downloadCredentialPng,
  printCredentialCard,
  renderCredentialDataUrl
} from '../lib/credentialRenderer';

export function CredencialDigitalModal({ socio, member, type, onClose }) {
  const targetMember = member || socio;
  const [rendered, setRendered] = useState(null);
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const previewData = useMemo(() => {
    if (!targetMember) return null;
    return buildCredentialData({
      member: targetMember,
      type,
      origin: typeof window !== 'undefined' ? window.location.origin : 'https://pruaned.cl'
    });
  }, [targetMember, type]);

  useEffect(() => {
    if (!targetMember) return undefined;
    let cancelled = false;
    setRendering(true);
    setRenderError('');

    renderCredentialDataUrl({ member: targetMember, type })
      .then((result) => {
        if (!cancelled) {
          setRendered(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Error generando credencial PRUANED:', err);
          setRenderError('No fue posible generar la vista previa de la credencial.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRendering(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [targetMember, type]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!targetMember || !previewData) return null;

  const isVolunteer = previewData.type === 'voluntario';
  const { widthMm, heightMm, widthPx, heightPx } = previewData.spec;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCredentialPng({
        member: targetMember,
        type,
        preRendered: rendered
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!rendered?.dataUrl) return;
    printCredentialCard(rendered);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isVolunteer ? 'Credencial Oficial de Voluntario/a PRUANED' : 'Credencial Oficial de Socio/a PRUANED'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 relative overflow-hidden my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          aria-label="Cerrar credencial"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7 space-y-5">
          {/* Encabezado del modal */}
          <div className="pr-10">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 ${
                isVolunteer
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isVolunteer ? <Sparkles className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              {isVolunteer ? 'Voluntariado Permanente · Terreno' : 'Acreditación Gremial · Socio'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              {isVolunteer ? 'Credencial Oficial de Voluntario/a' : 'Credencial Oficial de Socio'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tamaño estándar máximo de tarjeta de crédito CR80 ({widthMm.toFixed(2)} mm × {heightMm.toFixed(2)} mm) con validación QR en vivo.
            </p>
          </div>

          {/* Contenedor a escala real máxima de tarjeta de crédito */}
          <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3">
            <div
              className="relative rounded-[3.18mm] overflow-hidden shadow-xl ring-1 ring-slate-900/10 bg-white flex items-center justify-center"
              style={{
                width: `${widthMm}mm`,
                maxWidth: '100%',
                aspectRatio: `${widthPx} / ${heightPx}`
              }}
            >
              {rendering && (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 p-4 text-center">
                  <div className="w-7 h-7 border-2 border-slate-300 border-t-blue-900 rounded-full animate-spin" />
                  <span className="text-[11px] font-semibold">Generando credencial CR80...</span>
                </div>
              )}

              {!rendering && renderError && (
                <p className="text-xs text-rose-600 font-semibold text-center p-4">{renderError}</p>
              )}

              {!rendering && rendered?.dataUrl && (
                <img
                  src={rendered.dataUrl}
                  alt={`Credencial ${isVolunteer ? 'de Voluntario/a' : 'de Socio'} PRUANED de ${previewData.fullName} (${previewData.code})`}
                  className="w-full h-full object-contain block select-none"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                <QrCode className="w-3.5 h-3.5 text-blue-800" />
                {previewData.code}
              </span>
              <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-full border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                300 DPI listos para impresión 1:1
              </span>
              <a
                href={`/verificar/${encodeURIComponent(previewData.code)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-full border border-blue-200 transition-colors"
              >
                Probar verificación QR <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Aviso útil si aún no tiene foto de perfil */}
          {!previewData.photoUrl && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Tu credencial aún no tiene fotografía cargada. Sube tu foto de perfil desde{' '}
                <strong>{isVolunteer ? 'Mi Portal de Voluntario o Mi Perfil' : 'Mi Perfil'}</strong>{' '}
                para que aparezca automáticamente antes de imprimirla.
              </p>
            </div>
          )}

          {/* Acciones de descarga, impresión y cierre */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="order-3 sm:order-1 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              Cerrar
            </button>

            <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDownload}
                disabled={rendering || downloading || !rendered?.dataUrl}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Preparando PNG...' : 'Descargar credencial (PNG)'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={rendering || !rendered?.dataUrl}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir / Guardar PDF (CR80)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CredencialDigitalModal;
