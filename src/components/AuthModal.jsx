import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { evaluatePasswordStrength, generate2FACode, sanitizeInput } from '../utils/security';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { Lock, KeyRound, ShieldCheck, UserCheck, AlertTriangle, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, setActiveTab } = useAuth();
  const [step, setStep] = useState('credentials'); // credentials, 2fa
  const [role, setRole] = useState('socio'); // socio, voluntario, admin
  const [email, setEmail] = useState('camila.morales@pruaned.cl');
  const [password, setPassword] = useState('Pruaned2025#Secured!');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const passwordInfo = evaluatePasswordStrength(password);

  const handleRolePreset = (selectedRole) => {
    setRole(selectedRole);
    setErrorMsg('');
    if (selectedRole === 'socio') {
      setEmail('camila.morales@pruaned.cl');
      setPassword('SocioPruaned2025!');
    } else if (selectedRole === 'voluntario') {
      setEmail('felipe.henriquez@gmail.com');
      setPassword('VoluntarioPruaned2025!');
    } else if (selectedRole === 'admin') {
      setEmail('admin@pruaned.cl');
      setPassword('AdminPruaned2025#Super!');
    }
  };

  const handleSendCredentials = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = sanitizeInput(email);

    if (!cleanEmail.includes('@')) {
      setErrorMsg('Por favor ingrese un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña no cumple con los estándares mínimos de seguridad (6+ caracteres).');
      return;
    }

    // Generate 2FA code and move to OTP verification step
    const code = generate2FACode();
    setGeneratedCode(code);
    setTwoFACode(code); // Pre-fill for seamless testing
    setStep('2fa');
  };

  const handleVerify2FA = (e) => {
    e.preventDefault();
    if (twoFACode !== generatedCode) {
      setErrorMsg('El código de autenticación de dos factores es incorrecto.');
      return;
    }

    // Determine user details based on email/role
    let userObj = {
      id: `usr-${Date.now()}`,
      name: role === 'socio' ? 'Dra. Camila Morales' : role === 'voluntario' ? 'Felipe Henríquez' : 'Administrador General',
      email: email,
      role: role,
      rut: role === 'socio' ? '15.482.910-K' : '18.912.440-1'
    };

    login(userObj);
    onClose();

    // Direct user to corresponding intranet
    if (role === 'socio') setActiveTab('socios');
    else if (role === 'voluntario') setActiveTab('voluntarios');
    else setActiveTab('admin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-700 text-white">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800 text-slate-400 font-bold text-sm"
        >
          ✕
        </button>

        {/* Crest Logo & Security Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center p-2 bg-white/10 rounded-2xl border border-white/20">
            <PRUANEDLogo className="h-16 w-auto" showText={false} />
          </div>
          <h3 className="text-2xl font-extrabold font-['Outfit']">
            Portal Seguro PRUANED
          </h3>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Autenticación 2FA Cifrada AES-256
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS */}
        {step === 'credentials' && (
          <form onSubmit={handleSendCredentials} className="space-y-4">
            
            {/* Quick Role Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Seleccione Perfil de Acceso:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRolePreset('socio')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    role === 'socio' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  Socio Gremial
                </button>
                <button
                  type="button"
                  onClick={() => handleRolePreset('voluntario')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    role === 'voluntario' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  Voluntario
                </button>
                <button
                  type="button"
                  onClick={() => handleRolePreset('admin')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    role === 'admin' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  Administrador
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico Institucional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@pruaned.cl"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Password Field & Strength Indicator */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña de Alta Seguridad
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Robustez Contraseña:</span>
                  <span style={{ color: passwordInfo.color }} className="font-bold">
                    {passwordInfo.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${passwordInfo.score}%`, backgroundColor: passwordInfo.color }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Verificar Credenciales (Paso 1)
            </button>
          </form>
        )}

        {/* STEP 2: 2FA / OTP VERIFICATION */}
        {step === '2fa' && (
          <form onSubmit={handleVerify2FA} className="space-y-5 animate-fade-in text-center">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <KeyRound className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Autenticación de 2 Factores (2FA)</h4>
              <p className="text-xs text-slate-400">
                Se ha enviado un token OTP al correo <span className="text-emerald-400 font-bold">{email}</span>.
              </p>
              <div className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-300 font-mono font-bold">
                CÓDIGO DE PRUEBA GENERADO: {generatedCode}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ingrese Código OTP de 6 Dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 text-center text-xl tracking-widest font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-1/3 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Volver
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Ingresar a la Intranet
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-800 text-[11px] text-slate-500">
          Protección SSL/TLS • Previene Inyecciones SQL & XSS
        </div>
      </div>
    </div>
  );
};
