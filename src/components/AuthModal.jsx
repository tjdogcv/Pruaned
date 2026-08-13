import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { evaluatePasswordStrength, sanitizeInput } from '../utils/security';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { Lock, UserPlus, AlertTriangle, Eye, EyeOff, User, MailCheck, ShieldAlert } from 'lucide-react';
import { isSupabaseReady, supabase } from '../lib/supabase';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { loginStep1_RequestOTP, loginStep2_VerifyOTP, resetPasswordRequest, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode); // 'login', 'login_otp', 'register', 'forgot_password', 'update_password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  // Rate Limiting State
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return parseInt(localStorage.getItem('pruaned_auth_attempts') || '0', 10);
  });
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    return parseInt(localStorage.getItem('pruaned_auth_lockout') || '0', 10);
  });
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    let interval;
    if (lockoutUntil > Date.now()) {
      setLockoutRemaining(Math.ceil((lockoutUntil - Date.now()) / 1000));
      interval = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutRemaining(0);
          setFailedAttempts(0);
          localStorage.removeItem('pruaned_auth_attempts');
          localStorage.removeItem('pruaned_auth_lockout');
          clearInterval(interval);
        } else {
          setLockoutRemaining(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  if (!isOpen) return null;

  const passwordInfo = evaluatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (lockoutRemaining > 0) {
      setErrorMsg(`Sistema bloqueado temporalmente. Inténtalo de nuevo en ${lockoutRemaining} segundos.`);
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = sanitizeInput(email);

    if (mode !== 'login_otp' && mode !== 'update_password' && !cleanEmail.includes('@')) {
      setErrorMsg('Por favor ingrese un correo electrónico válido.');
      return;
    }
    if ((mode === 'register' || mode === 'update_password') && password.length < 6) {
      setErrorMsg('La contraseña no cumple con los estándares mínimos de seguridad (6+ caracteres).');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        // Paso 1: Validar contraseña y solicitar OTP
        await loginStep1_RequestOTP(cleanEmail, password);
        setMode('login_otp');
        setSuccessMsg('Código enviado a tu correo. Por favor revísalo e ingrésalo a continuación.');
        setFailedAttempts(0);
        localStorage.removeItem('pruaned_auth_attempts');
      } else if (mode === 'login_otp') {
        // Paso 2: Validar OTP y entrar
        if (!twoFactorCode || twoFactorCode.length < 6) {
          throw new Error('Código OTP inválido.');
        }

        const targetTab = await loginStep2_VerifyOTP(cleanEmail, twoFactorCode);
        setFailedAttempts(0);
        localStorage.removeItem('pruaned_auth_attempts');
        onClose();
        if (targetTab === 'socios') navigate('/intranet/socios');
        else if (targetTab === 'voluntarios') navigate('/intranet/voluntarios');
        else navigate('/intranet/socios');
      } else if (mode === 'register') {
        // Modo Registro / Activar Cuenta
        if (isSupabaseReady()) {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
          });
          if (error) throw error;
          
          setSuccessMsg('¡Cuenta creada y activada con éxito! Ahora puedes iniciar sesión.');
          setMode('login');
          setPassword('');
        } else {
          setErrorMsg('El sistema de registro en la nube aún no está conectado.');
        }
      } else if (mode === 'forgot_password') {
        await resetPasswordRequest(cleanEmail);
        setSuccessMsg('Enlace de recuperación enviado. Revisa tu bandeja de entrada.');
        setMode('login');
      } else if (mode === 'update_password') {
        if (password !== confirmPassword) {
          setErrorMsg('Las contraseñas no coinciden.');
          setIsLoading(false);
          return;
        }
        await updatePassword(password);
        setSuccessMsg('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
        setMode('login');
      }
    } catch (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('pruaned_auth_attempts', newAttempts.toString());

      if (newAttempts >= 3) {
        const lockTime = Date.now() + 5 * 60 * 1000; // 5 minutos de bloqueo
        setLockoutUntil(lockTime);
        localStorage.setItem('pruaned_auth_lockout', lockTime.toString());
        setErrorMsg('Demasiados intentos fallidos. Por seguridad, el acceso ha sido bloqueado por 5 minutos.');
      } else {
        setErrorMsg(error.message || 'Error en la autenticación. Intento ' + newAttempts + ' de 3.');
      }
    } finally {
      setIsLoading(false);
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
            {mode === 'forgot_password' ? 'Recuperar Clave' : mode === 'update_password' ? 'Nueva Contraseña' : 'Portal Seguro PRUANED'}
          </h3>
          
          {(mode === 'login' || mode === 'register' || mode === 'login_otp') && (
            <div className="flex bg-slate-800 p-1 rounded-xl w-full mx-auto mt-4">
              <button
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${(mode === 'login' || mode === 'login_otp') ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Activar Cuenta
              </button>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <MailCheck className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej: correo@ejemplo.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {(mode === 'login' || mode === 'register') && (
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> {mode === 'login' ? 'Contraseña' : 'Crear Contraseña'}
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

                {mode === 'register' && (
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
                )}
              </div>
              
              {mode === 'login' && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </>
          )}

          {mode === 'update_password' && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Nueva Contraseña
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
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Confirmar Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {mode === 'login_otp' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Código OTP (Revisa tu correo)
              </label>
              <input
                type="text"
                placeholder="12345678"
                maxLength={8}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-2xl text-white focus:outline-none focus:border-blue-500 font-mono tracking-[0.5em] text-center"
              />
            </div>
          )}

          {lockoutRemaining > 0 && (
            <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-sm font-bold text-center flex flex-col items-center gap-2 animate-pulse">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
              <span>SISTEMA BLOQUEADO</span>
              <span className="text-xs font-normal">Inténtalo de nuevo en {Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || lockoutRemaining > 0}
            className="w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 mt-6 shadow-lg shadow-blue-900/20 bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : lockoutRemaining > 0 ? (
              `Bloqueado (${lockoutRemaining}s)`
            ) : mode === 'forgot_password' ? (
              'Enviar Enlace de Recuperación'
            ) : mode === 'update_password' ? (
              'Guardar Nueva Contraseña'
            ) : mode === 'register' ? (
              'Verificar y Activar Cuenta'
            ) : mode === 'login_otp' ? (
              'Validar y Entrar'
            ) : (
              'Continuar con Contraseña'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
