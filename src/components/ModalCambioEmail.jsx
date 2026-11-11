import React, { useState } from 'react';
import { Mail, AlertTriangle, CheckCircle2, X, ShieldAlert, User, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ModalCambioEmail({ miembro, tipo = 'socio', onClose, onSuccess }) {
  const { cambiarEmailMiembro } = useAuth();
  
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState('');
  const [motivo, setMotivo] = useState('Pérdida de acceso a correo anterior');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [confirmadoCheck, setConfirmadoCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!miembro) return null;

  const emailActual = miembro.email || 'No registrado';
  const nombreMiembro = miembro.nombre || miembro.nombreCompleto || 'Miembro';
  const rutMiembro = miembro.rut || 'No informado';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = nuevoEmail.trim().toLowerCase();
    const cleanConfirm = confirmarEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanConfirm) {
      setErrorMsg('Debes ingresar y confirmar el nuevo correo electrónico.');
      return;
    }

    if (cleanEmail !== cleanConfirm) {
      setErrorMsg('Los correos electrónicos ingresados no coinciden.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('El formato del correo electrónico ingresado no es válido.');
      return;
    }

    if (cleanEmail === emailActual.toLowerCase()) {
      setErrorMsg('El nuevo correo no puede ser idéntico al correo actual.');
      return;
    }

    if (!confirmadoCheck) {
      setErrorMsg('Debes marcar la casilla de confirmación para autorizar el cambio.');
      return;
    }

    setLoading(true);
    try {
      const motivoFinal = motivoDetalle.trim() 
        ? `${motivo} - Detalle: ${motivoDetalle.trim()}`
        : motivo;

      await cambiarEmailMiembro({
        tipo,
        id: miembro.id,
        emailNuevo: cleanEmail,
        motivo: motivoFinal
      });

      setSuccessMsg(`✓ Correo actualizado exitosamente a: ${cleanEmail}`);
      setTimeout(() => {
        if (onSuccess) onSuccess(cleanEmail);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar el correo electrónico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
      <div 
        role="dialog" 
        aria-modal="true" 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
      >
        {/* Cabecera */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                Directiva &amp; Administración
              </span>
              <h3 className="text-lg font-bold font-['Outfit'] mt-1 text-white">
                Cambio de Correo Electrónico
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha del miembro */}
        <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-900">{nombreMiembro}</span>
            <span className="text-slate-500 font-mono">({rutMiembro})</span>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-full text-[10px] uppercase">
            {tipo === 'socio' ? 'Socio Oficial' : 'Voluntario'}
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Advertencia / Contexto */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Acción de recuperación de acceso</p>
              <p className="text-amber-800 leading-relaxed">
                Utiliza este módulo cuando el socio o voluntario haya perdido el control de su correo anterior. Se sincronizará su ficha y su cuenta de acceso institucional.
              </p>
            </div>
          </div>

          {/* Correo Actual */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Correo Electrónico Registrado Actualmente
            </label>
            <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-xs font-mono text-slate-700 border border-slate-200 flex items-center justify-between">
              <span>{emailActual}</span>
              <span className="text-[10px] text-slate-500 font-sans font-bold">Actual</span>
            </div>
          </div>

          {/* Nuevo Correo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Nuevo Correo *
              </label>
              <input
                type="email"
                required
                value={nuevoEmail}
                onChange={e => setNuevoEmail(e.target.value)}
                placeholder="nuevo@correo.cl"
                disabled={loading}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmar Nuevo Correo *
              </label>
              <input
                type="email"
                required
                value={confirmarEmail}
                onChange={e => setConfirmarEmail(e.target.value)}
                placeholder="nuevo@correo.cl"
                disabled={loading}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Motivo del cambio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo o Justificación del Cambio *
            </label>
            <select
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              disabled={loading}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-600 outline-none font-medium text-slate-800"
            >
              <option value="Pérdida de acceso a correo anterior">Pérdida de acceso a correo anterior (olvido / bloqueo)</option>
              <option value="Solicitud formal de cambio de correo por el titular">Solicitud formal de cambio de correo por el titular</option>
              <option value="Error de digitación en el registro inicial">Error de digitación en el registro inicial</option>
              <option value="Cambio de correo institucional o laboral">Cambio de correo institucional o laboral</option>
              <option value="Otro motivo justificado">Otro motivo justificado</option>
            </select>
          </div>

          {motivo === 'Otro motivo justificado' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detalle del motivo *
              </label>
              <input
                type="text"
                required
                value={motivoDetalle}
                onChange={e => setMotivoDetalle(e.target.value)}
                placeholder="Indica el motivo específico del cambio..."
                disabled={loading}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
          )}

          {/* Checkbox de Confirmación */}
          <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmadoCheck}
              onChange={e => setConfirmadoCheck(e.target.checked)}
              disabled={loading}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="leading-tight text-slate-600">
              Certifico que se verificó la identidad del miembro y autorizo la modificación de sus credenciales. Esta operación quedará registrada en el log de auditoría.
            </span>
          </label>

          {/* Mensajes de Feedback */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !confirmadoCheck}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-amber-400" /> Guardar Nuevo Correo
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
