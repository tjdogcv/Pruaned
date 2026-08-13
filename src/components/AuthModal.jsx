import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { evaluatePasswordStrength, sanitizeInput } from '../utils/security';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { Lock, UserPlus, AlertTriangle, Eye, EyeOff, User } from 'lucide-react';
import { isSupabaseReady, supabase } from '../lib/supabase';

export const AuthModal = ({ isOpen, onClose }) => {
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const passwordInfo = evaluatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = sanitizeInput(email);

    if (!cleanEmail.includes('@')) {
      setErrorMsg('Por favor ingrese un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña no cumple con los estándares mínimos de seguridad (6+ caracteres).');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!twoFactorCode || twoFactorCode !== '123456') {
          throw new Error('Código 2FA inválido. Por favor ingrese el código correcto.');
        }

        const targetTab = await loginWithCredentials(cleanEmail, password);
        onClose();
        if (targetTab === 'socios') navigate('/intranet/socios');
        else if (targetTab === 'voluntarios') navigate('/intranet/voluntarios');
        else navigate('/intranet/socios');
      } else {
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
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error en la autenticación.');
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
            Portal Seguro PRUANED
          </h3>
          
          <div className="flex bg-slate-800 p-1 rounded-xl w-full mx-auto mt-4">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
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
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
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
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Código 2FA (Autenticador)
              </label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 ${mode === 'login' ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'} text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="animate-pulse">Cargando...</span>
            ) : mode === 'login' ? (
              <><Lock className="w-4 h-4" /> Iniciar Sesión</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Activar Mi Cuenta</>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
