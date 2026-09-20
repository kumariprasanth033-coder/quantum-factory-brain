import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  User,
  Sparkles,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('manager@quantumfactory.local');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'admin' | 'manager' | 'operator'>('manager');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your factory user email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    try {
      await login(email.trim(), password);
      setSuccessNotice('Authentication verified. Loading factory dashboard...');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Use demo passwords: password123, admin123, or manager123.');
    }
  };

  const handleQuickDemo = async (targetRole: 'admin' | 'manager') => {
    setErrorMessage(null);
    const targetEmail = targetRole === 'admin' ? 'admin@quantumfactory.local' : 'manager@quantumfactory.local';
    const targetPass = targetRole === 'admin' ? 'admin123' : 'manager123';
    setEmail(targetEmail);
    setPassword(targetPass);
    setRole(targetRole);

    try {
      await login(targetEmail, targetPass);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      demoLogin(targetRole);
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-xl shadow-cyan-500/20 mb-4 ring-1 ring-cyan-400/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            Quantum Factory
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              BRAIN
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic Flexible Job-Shop Scheduling (DFJSSP) Platform
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Amaravati Quantum Valley &middot; Government of AP</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">Factory Access Portal</h2>
            <p className="text-xs text-slate-400">Authenticate to enter plant scheduling and machine dispatch controls.</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-[11px] text-rose-300/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Workstation Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@quantumfactory.local"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Demo: password123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Role &amp; Privilege Tier
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="login-role-manager"
                  onClick={() => setRole('manager')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    role === 'manager'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Factory Manager
                </button>
                <button
                  type="button"
                  id="login-role-admin"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    role === 'admin'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  System Admin
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Enter Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>One-Click Authorized Accounts</span>
            </div>

            <div className="space-y-2">
              <button
                id="quick-login-manager"
                onClick={() => handleQuickDemo('manager')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                    Chief Production Manager
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">manager@quantumfactory.local</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  Enter &rarr;
                </span>
              </button>

              <button
                id="quick-login-admin"
                onClick={() => handleQuickDemo('admin')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                    System Administrator
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">admin@quantumfactory.local</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Enter &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Multi-Tenant Disclaimer */}
        <div className="mt-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Role-Based Access Control &middot; Multi-Factory Isolation Active</span>
        </div>
      </div>
    </div>
  );
};
