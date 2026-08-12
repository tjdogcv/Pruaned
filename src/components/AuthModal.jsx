import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { evaluatePasswordStrength, generate2FACode, sanitizeInput } from '../utils/security';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { Lock, KeyRound, ShieldCheck, UserCheck, AlertTriangle, Eye, EyeOff, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, setActiveTab } = useAuth();
  const [step, setStep] = useState('credentials'); // credentials, 2fa
  const [role, setRole] = useState('master'); // master, directiva, socio_delegado, voluntario
  const [email, setEmail] = useState('ag.pruaned@gmail.com');
  const [password, setPassword] = useState('MasterPruaned2025#Super!');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const passwordInfo = evaluatePasswordStrength(password);

  const handleRolePreset = (selectedRole) => {
    setRole(selectedRole);
    setErrorMsg('');
    if (selectedRole === 'master') {
      setEmail('ag.pruaned@gmail.com');
      setPassword('MasterPruaned2025#Super!');
    } else if (selectedRole === 'directiva') {
      setEmail('presidente.directiva@pruaned.cl');
      setPassword('DirectivaPruaned2025!');
    } else if (selectedRole === 'socio_delegado') {
      setEmail('camila.morales@pruaned.cl');
      setPassword('SocioPruaned2025!');
    } else if (selectedRole === 'voluntario') {
      setEmail('felipe.henriquez@gmail.com');
      setPassword('VoluntarioPruaned2025!');
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

    let mappedRole = 'socio';
    let name = 'Dra. Camila Morales';
    let permisoVoluntarios = false;

    if (role === 'master' || email === 'ag.pruaned@gmail.com') {
      mappedRole = 'master';
      name = 'Usuario Maestro PRUANED A.G.';
      permisoVoluntarios = true;
    } else if (role === 'directiva') {
      mappedRole = 'directiva';
      name = 'Presidente Directiva Nacional';
      permisoVoluntarios = true;
    } else if (role === 'socio_delegado') {
      mappedRole = 'socio';
      name = 'Dra. Camila Morales (Delegada Voluntarios)';
      permisoVoluntarios = true;
    } else if (role === 'voluntario') {
      mappedRole = 'voluntario';
      name = 'Felipe Henríquez';
      permisoVoluntarios = false;
    }

    let userObj = {
      id: `usr-${Date.now()}`,
      name: name,
      email: email,
      role: mappedRole,
      permisoGestionVoluntarios: permisoVoluntarios,
      rut: role === 'voluntario' ? '18.912.440-1' : '15.482.910-K'
    };

    login(userObj);
    onClose();

    if (mappedRole === 'master' || mappedRole === 'directiva' || mappedRole === 'socio') {
      setActiveTab('socios');
    } else {
      setActiveTab('voluntarios');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-700 text-white">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800 text-slate-400 font-bold text-sm"
        >
          ✕
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex justify-center p-2 bg-white/10 rounded-2xl border border-white/20">
            <PRUANEDLogo className="h-14 w-auto" showText={false} />
          </div>
          <h3 className="text-2xl font-extrabold font-['Outfit']">
            Portal Seguro PRUANED
          </h3>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Autenticación 2FA & Roles RBAC
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleSendCredentials} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Seleccione Perfil / Rol de Usuario:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRolePreset('master')}
                  className={`p-2.5 rounded-xl font-bold text-left transition-all ${
                    role === 'master' ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <div className="font-extrabold">👑 Usuario Maestro</div>
                  <div className="text-[10px] text-slate-300 font-normal">ag.pruaned@gmail.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRolePreset('directiva')}
                  className={`p-2.5 rounded-xl font-bold text-left transition-all ${
                    role === 'directiva' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <div className="font-extrabold">🏛️ Directiva Nacional</div>
                  <div className="text-[10px] text-slate-300 font-normal">Voluntarios, Finanzas & CMS</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRolePreset('socio_delegado')}
                  className={`p-2.5 rounded-xl font-bold text-left transition-all ${
                    role === 'socio_delegado' ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <div className="font-extrabold">👤 Socio Habilitado</div>
                  <div className="text-[10px] text-slate-300 font-normal">Socio + Permiso Voluntarios</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRolePreset('voluntario')}
                  className={`p-2.5 rounded-xl font-bold text-left transition-all ${
                    role === 'voluntario' ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <div className="font-extrabold">👷 Voluntario</div>
                  <div className="text-[10px] text-slate-300 font-normal">LMS & Disponibilidad</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico Registrado
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña de Acceso
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

        {step === '2fa' && (
          <form onSubmit={handleVerify2FA} className="space-y-5 animate-fade-in text-center">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <KeyRound className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Autenticación de 2 Factores (2FA)</h4>
              <p className="text-xs text-slate-400">
                Se ha enviado un token OTP al correo Maestro <span className="text-emerald-400 font-bold font-mono">{email}</span>.
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

      </div>
    </div>
  );
};
