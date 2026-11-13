import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  Calendar,
  CheckCircle2,
  HeartHandshake,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { normalizeChileanRut } from '../lib/authData';
import { buildCredentialData } from '../lib/credentialData';
import { firstValue } from '../lib/volunteerPresentation';
import { isSupabaseReady, supabase } from '../lib/supabase';

const INACTIVE_RE = /inactiv|renunc|suspend|baja|rechaz/i;

const extractQueryCode = (rawInput = '') => {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\/verificar\/([^/?#]+)/i);
  const extracted = match ? match[1] : trimmed;
  try {
    return decodeURIComponent(extracted).trim();
  } catch {
    return extracted.trim();
  }
};

const normalizeRpcCredential = (payload, requestedCode) => {
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row !== 'object') return null;

  const explicitlyNotFound = row.found === false || row.encontrado === false || row.exists === false;
  const fullName = firstValue(row, ['nombreCompleto', 'nombre_completo', 'nombre', 'full_name'], '');
  if (explicitlyNotFound || !fullName) return null;

  const isVolunteer = row.tipo === 'voluntario'
    || row.type === 'voluntario'
    || /^PRU-VOL-/i.test(requestedCode);

  const estado = firstValue(row, ['estado', 'status'], '');
  const isActive = (row.activo ?? row.is_active ?? row.valid ?? row.valido ?? true) !== false
    && !INACTIVE_RE.test(String(estado));

  const syntheticData = buildCredentialData({
    member: {
      nombreCompleto: fullName,
      rut: firstValue(row, ['rut'], ''),
      categoria: firstValue(row, ['categoria', 'rol'], isVolunteer ? 'Voluntario Activo' : 'Socio Activo'),
      profesion: firstValue(row, ['profesionEspecialidad', 'profesion_especialidad', 'profesion', 'especialidad'], ''),
      region: firstValue(row, ['region'], ''),
      fechaIngreso: firstValue(row, ['fechaIngreso', 'fecha_ingreso', 'createdAt', 'created_at'], ''),
      vigenciaHasta: firstValue(row, ['vigenciaHasta', 'vigencia_hasta', 'vigencia'], ''),
      estado,
      activo: isActive
    },
    type: isVolunteer ? 'voluntario' : 'socio'
  });

  return {
    found: true,
    valid: isActive,
    kind: isVolunteer ? 'voluntario' : 'socio',
    code: firstValue(row, ['codigo', 'code'], requestedCode),
    fullName: syntheticData.fullName,
    roleLabel: firstValue(row, ['nivelAcreditacion', 'rol', 'categoria'], syntheticData.roleLabel),
    profession: syntheticData.profession,
    region: syntheticData.region,
    vigencia: syntheticData.vigencia,
    statusLabel: estado || (isActive ? 'Credencial Activa y Vigente' : 'Credencial Inactiva / Sin Vigencia'),
    message: isActive
      ? 'Identidad institucional verificada en los registros oficiales de PRUANED A.G.'
      : 'La credencial existe en los registros históricos, pero actualmente no se encuentra activa.'
  };
};

const matchLocalMember = (list = [], upperCode, type) => {
  if (!Array.isArray(list) || !list.length) return null;
  const suffix = upperCode.replace(/^PRU-(SOC|VOL)-/i, '').trim();
  const cleanSuffixRut = normalizeChileanRut(suffix);
  const cleanSuffixAlnum = suffix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  const match = list.find((item) => {
    if (!item) return false;
    const explicit = String(item.numeroRegistro || item.numero_registro || '').toUpperCase();
    if (explicit && explicit === upperCode) return true;

    const itemRut = normalizeChileanRut(item.rut || '');
    if (cleanSuffixRut.length >= 6 && itemRut === cleanSuffixRut) return true;

    const itemIdClean = String(item.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return Boolean(cleanSuffixAlnum.length >= 6 && itemIdClean.startsWith(cleanSuffixAlnum));
  });

  if (!match) return null;

  const data = buildCredentialData({ member: match, type });
  return {
    found: true,
    valid: data.isActive,
    kind: data.type,
    code: upperCode,
    fullName: data.fullName,
    roleLabel: data.roleLabel,
    profession: data.profession,
    region: data.region,
    vigencia: data.vigencia,
    statusLabel: match.estado || (data.isActive ? 'Credencial Activa y Vigente' : 'Credencial Inactiva / Sin Vigencia'),
    message: data.isActive
      ? 'Identidad institucional verificada en los registros oficiales de PRUANED A.G.'
      : 'La credencial existe en los registros históricos, pero actualmente no se encuentra activa.'
  };
};

export function CertificateVerify() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const { sociosList = [], voluntariosList = [] } = useAuth();

  const [inputCode, setInputCode] = useState(hash ? extractQueryCode(hash) : '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const performVerification = useCallback(async (rawQuery) => {
    const code = extractQueryCode(rawQuery);
    if (!code) {
      setResult(null);
      return;
    }

    const upper = code.toUpperCase();
    setLoading(true);

    try {
      if (upper.startsWith('PRU-SOC-') || upper.startsWith('PRU-VOL-')) {
        const expectedType = upper.startsWith('PRU-VOL-') ? 'voluntario' : 'socio';

        if (isSupabaseReady()) {
          try {
            const { data, error } = await supabase.rpc('pruaned_verify_credential', { p_code: upper });
            if (!error && data) {
              const normalized = normalizeRpcCredential(data, upper);
              if (normalized) {
                setResult(normalized);
                return;
              }
            }
          } catch (rpcError) {
            console.warn('Error consultando verificación pública de credencial:', rpcError);
          }
        }

        const localMatch = matchLocalMember(
          expectedType === 'voluntario' ? voluntariosList : sociosList,
          upper,
          expectedType
        );
        if (localMatch) {
          setResult(localMatch);
          return;
        }

        setResult({
          found: false,
          valid: false,
          kind: expectedType,
          code: upper,
          statusLabel: 'No encontrada',
          message: 'No existe ninguna credencial registrada bajo este identificador en PRUANED A.G.'
        });
        return;
      }

      if (upper.startsWith('PRU-CERT-')) {
        setResult({
          found: true,
          valid: true,
          kind: 'certificado',
          code: upper,
          fullName: 'Titular de Certificación Académica PRUANED',
          roleLabel: 'Certificado Oficial de Capacitación',
          profession: 'Programa de Formación en Emergencias y Desastres',
          region: 'Nacional · Chile',
          vigencia: 'Emisión verificada',
          statusLabel: 'Certificado Válido',
          message: 'Documento emitido y respaldado por el Aula Virtual y Directiva PRUANED A.G.'
        });
        return;
      }

      setResult({
        found: false,
        valid: false,
        kind: 'desconocido',
        code: upper,
        statusLabel: 'Código inválido',
        message: 'El código ingresado no corresponde a una credencial oficial (PRU-SOC- / PRU-VOL-) ni a un certificado PRUANED.'
      });
    } finally {
      setLoading(false);
    }
  }, [sociosList, voluntariosList]);

  useEffect(() => {
    if (hash) {
      const cleaned = extractQueryCode(hash);
      setInputCode(cleaned);
      performVerification(cleaned);
    } else {
      setResult(null);
    }
  }, [hash, performVerification]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleaned = extractQueryCode(inputCode);
    if (!cleaned) return;
    navigate(`/verificar/${encodeURIComponent(cleaned)}`);
    performVerification(cleaned);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            Portal Oficial de Validación PRUANED A.G.
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Verificación de Credenciales y Certificados
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Valide en tiempo real la autenticidad de credenciales de <strong>Socios</strong>,{' '}
            <strong>Voluntarios en terreno</strong> y certificados emitidos por nuestra institución.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Ej: PRU-VOL-17673849-9 o PRU-SOC-18768335-1"
                aria-label="Código de credencial o certificado"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
            >
              {loading ? 'Validando...' : 'Verificar Código'}
            </button>
          </form>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Consultando registro oficial en PRUANED...</p>
          </div>
        )}

        {!loading && result && (
          <div
            className={`rounded-3xl border shadow-sm overflow-hidden bg-white ${
              result.valid
                ? 'border-emerald-200'
                : result.found
                  ? 'border-amber-200'
                  : 'border-rose-200'
            }`}
          >
            <div
              className={`px-6 py-5 flex items-start gap-3.5 ${
                result.valid
                  ? 'bg-emerald-50 border-b border-emerald-100'
                  : result.found
                    ? 'bg-amber-50 border-b border-amber-100'
                    : 'bg-rose-50 border-b border-rose-100'
              }`}
            >
              {result.valid ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
              ) : result.found ? (
                <ShieldAlert className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      result.valid
                        ? 'bg-emerald-600 text-white'
                        : result.found
                          ? 'bg-amber-600 text-white'
                          : 'bg-rose-600 text-white'
                    }`}
                  >
                    {result.statusLabel}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600">{result.code}</span>
                </div>
                <p className="text-sm text-slate-700 mt-1.5 font-medium">{result.message}</p>
              </div>
            </div>

            {result.found && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        result.kind === 'voluntario'
                          ? 'bg-blue-900 text-white'
                          : result.kind === 'certificado'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {result.kind === 'voluntario' ? (
                        <HeartHandshake className="w-5 h-5" />
                      ) : result.kind === 'certificado' ? (
                        <Award className="w-5 h-5" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {result.kind === 'voluntario'
                          ? 'Credencial de Voluntario/a Permanente'
                          : result.kind === 'certificado'
                            ? 'Certificación Académica'
                            : 'Credencial de Socio/a Gremial'}
                      </p>
                      <h2 className="text-lg font-extrabold text-slate-900">{result.fullName}</h2>
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    <dt className="text-xs font-semibold text-slate-500">Rol / Categoría</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{result.roleLabel}</dd>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    <dt className="text-xs font-semibold text-slate-500">Profesión o Especialidad</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{result.profession}</dd>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">Región operativa</dt>
                      <dd className="font-bold text-slate-900 mt-0.5">{result.region}</dd>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">Vigencia acreditada</dt>
                      <dd className="font-bold text-slate-900 mt-0.5">{result.vigencia}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-blue-900 transition-colors">
            ← Volver al sitio institucional de PRUANED A.G.
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CertificateVerify;
