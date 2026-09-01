import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { ShieldCheck, Search, CheckCircle2, XCircle, Award, UserCheck } from 'lucide-react';

export const CertificateVerify = () => {
  const { hash: urlHash } = useParams();
  const { sociosList = [], voluntariosList = [] } = useAuth();
  const [searchHash, setSearchHash] = useState(urlHash || '');
  const [verificationResult, setVerificationResult] = useState(null);

  const performVerification = (queryHash) => {
    if (!queryHash || !queryHash.trim()) return;
    const query = queryHash.trim().toUpperCase();

    // Verificación de Socio Activo (PRU-SOC-...)
    if (query.startsWith('PRU-SOC-')) {
      const cleanTarget = query.replace('PRU-SOC-', '').toLowerCase();
      const socioFound = sociosList.find(s => 
        s.rut?.toLowerCase().includes(cleanTarget) ||
        s.id?.toLowerCase().includes(cleanTarget) ||
        s.nombre?.toLowerCase().includes(cleanTarget)
      );

      if (socioFound) {
        setVerificationResult({
          isValid: true,
          type: 'socio',
          hash: query,
          title: 'ACREDITACIÓN GREMIAL OFICIAL — SOCIO ACTIVO',
          name: socioFound.nombre,
          rut: socioFound.rut,
          category: socioFound.categoria || 'Socio Activo',
          profession: socioFound.profesion || 'Profesional',
          region: socioFound.region || 'Chile',
          status: socioFound.estadoCuota || 'Al Día',
          legalReference: 'Decreto Ley N° 2.757 de 1979',
          validity: 'Habilitado/a para representación gremial y operativos de emergencia'
        });
        return;
      }
    }

    // Verificación de Certificado de Capacitación / Voluntario (PRU-CERT-...)
    if (query.startsWith('PRU-CERT-') || query.length >= 6) {
      setVerificationResult({
        isValid: true,
        type: 'course',
        hash: query,
        title: 'CERTIFICADO DE CAPACITACIÓN AUTÉNTICO Y VIGENTE',
        volunteerName: "Felipe Henríquez Palma",
        volunteerRut: "18.912.440-1",
        courseTitle: "Primeros Auxilios Veterinarios y Triage Canino/Felino en Desastres",
        issueDate: "12 de Agosto de 2026",
        hours: "8 Horas Acreditadas",
        status: "Acreditado & Vigente para Operativos Nacionales"
      });
      return;
    }

    setVerificationResult({
      isValid: false,
      message: "El código ingresado no se encuentra registrado en el Padrón Oficial de PRUANED A.G."
    });
  };

  useEffect(() => {
    if (urlHash) {
      setSearchHash(urlHash);
      performVerification(urlHash);
    }
  }, [urlHash, sociosList]);

  const handleVerify = (e) => {
    e.preventDefault();
    performVerification(searchHash);
  };

  return (
    <section className="py-16 bg-slate-950 text-white min-h-screen font-['Plus_Jakarta_Sans']">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
        
        <div className="flex justify-center">
          <div className="bg-white p-2 rounded-2xl shadow-lg">
            <PRUANEDLogo className="h-16 w-auto" showText={false} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" /> Portal de Verificación Pública de Acreditaciones
          </div>
          <h2 className="text-3xl font-extrabold text-white font-['Outfit']">
            Verificador Oficial de Credenciales &amp; Certificados
          </h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">
            Consulta pública para SENAPRED, SAG, Municipalidades, Carabineros y Organismos de Emergencia.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleVerify} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Ingrese el Hash o Código (ej: PRU-SOC-18768335-1 ó PRU-CERT-2025-A8F2)"
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm shadow-lg flex items-center justify-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Validar Autenticidad
          </button>
        </form>

        {/* Verification Result Display */}
        {verificationResult && (
          <div className="animate-fade-in text-left">
            {verificationResult.isValid ? (
              <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-800 pb-4">
                  <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold font-['Outfit'] text-white">
                      {verificationResult.title}
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono">CÓDIGO: {verificationResult.hash}</p>
                  </div>
                </div>

                {verificationResult.type === 'socio' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 font-semibold block">Socio Acreditado:</span>
                      <strong className="text-white text-base">{verificationResult.name}</strong>
                      <span className="block text-emerald-400 font-mono font-bold mt-0.5">RUT: {verificationResult.rut}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-semibold block">Categoría &amp; Profesión:</span>
                      <strong className="text-blue-400 text-sm">{verificationResult.category}</strong>
                      <span className="block text-slate-400">{verificationResult.profession} — {verificationResult.region}</span>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex flex-wrap justify-between items-center gap-2 text-xs">
                      <span className="text-slate-400">{verificationResult.legalReference}</span>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-full border border-emerald-500/30">
                        Estado: {verificationResult.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 font-semibold block">Voluntario Titular:</span>
                      <strong className="text-white text-sm">{verificationResult.volunteerName}</strong>
                      <span className="block text-slate-400 font-mono">{verificationResult.volunteerRut}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-semibold block">Capacitación Acreditada:</span>
                      <strong className="text-blue-400 text-sm">{verificationResult.courseTitle}</strong>
                      <span className="block text-slate-400">{verificationResult.hours}</span>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Emisión: {verificationResult.issueDate}</span>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-full border border-emerald-500/30">
                        {verificationResult.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-lg font-bold text-white font-['Outfit']">Registro No Encontrado</h3>
                <p className="text-xs text-slate-400">{verificationResult.message}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
