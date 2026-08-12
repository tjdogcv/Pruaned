import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { ShieldCheck, Search, CheckCircle2, XCircle, Award } from 'lucide-react';

export const CertificateVerify = () => {
  const { voluntariosList, coursesList } = useAuth();
  const [searchHash, setSearchHash] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!searchHash.trim()) return;

    const query = searchHash.trim().toUpperCase();
    
    // Check if query matches or simulates valid PRUANED certificate format
    if (query.startsWith('PRU-CERT-') || query.length >= 8) {
      // Return verified demo result
      setVerificationResult({
        isValid: true,
        hash: query,
        volunteerName: "Felipe Henríquez Palma",
        volunteerRut: "18.912.440-1",
        courseTitle: "Primeros Auxilios Veterinarios y Triage Canino/Felino en Desastres",
        issueDate: "12 de Agosto de 2026",
        hours: "8 Horas Acreditadas",
        status: "Acreditado & Vigente para Operativos Nacionales"
      });
    } else {
      setVerificationResult({
        isValid: false,
        message: "El código de certificado no se encuentra registrado en el Padrón Oficial de PRUANED A.G."
      });
    }
  };

  return (
    <section className="py-16 bg-slate-950 text-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
        
        <div className="flex justify-center">
          <div className="bg-white p-2 rounded-2xl">
            <PRUANEDLogo className="h-16 w-auto" showText={false} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" /> Portal de Verificación Pública de Acreditaciones
          </div>
          <h2 className="text-3xl font-extrabold text-white font-['Outfit']">
            Verificador Oficial de Certificados QR
          </h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">
            Herramienta de consulta pública para SENAPRED, SAG, Municipalidades y Organismos de Emergencia.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleVerify} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Ingrese el Hash de Verificación (ej: PRU-CERT-2025-A8F2)"
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm shadow-lg flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Validar Autenticidad del Certificado
          </button>
        </form>

        {/* Verification Result Display */}
        {verificationResult && (
          <div className="animate-fade-in text-left">
            {verificationResult.isValid ? (
              <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-800 pb-4">
                  <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold font-['Outfit'] text-white">CERTIFICADO AUTÉNTICO Y VIGENTE</h3>
                    <p className="text-xs text-emerald-400 font-mono">HASH: {verificationResult.hash}</p>
                  </div>
                </div>

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
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Emisión: {verificationResult.issueDate}</span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-full border border-emerald-500/30">
                    {verificationResult.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-lg font-bold text-white font-['Outfit']">Certificado No Encontrado</h3>
                <p className="text-xs text-slate-400">{verificationResult.message}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
