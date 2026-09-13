import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Building2, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MosqueLogoIcon } from '../layout/IslamicPattern';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Harap masukkan username dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await login(username.trim(), password, rememberMe);
      if (!res.success) {
        setErrorMsg(res.message || 'Username atau kata sandi tidak sesuai.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kendala saat menghubungkan ke sistem. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-[#F8FAFC] to-emerald-50/20 dark:from-[#070D18] dark:via-[#0B1322] dark:to-[#0F1B2E] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/20 transition-colors">
      <div className="w-full max-w-sm mx-auto my-auto flex flex-col items-center">
        
        {/* BRANDING HEADER */}
        <header className="w-full text-center mb-5 flex flex-col items-center">
          {/* SIMBOL MASJID / IKON AWAL SIMKA.ID */}
          <div className="w-full flex items-center justify-center px-2 mb-3">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#101C2F] shadow-md border border-slate-200/80 dark:border-[#1E3048]">
              <MosqueLogoIcon className="w-12 h-12" />
            </div>
          </div>

          {/* SIMKA.ID Title & Unit Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 tracking-wide mb-1.5">
            <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Unit SMP • MA • SMA</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            SIMKA<span className="text-emerald-600 dark:text-emerald-400">.ID</span>
          </h1>

          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs leading-relaxed">
            Sistem Monitoring Karakter &amp; Akhlak Santri
          </p>
        </header>

        {/* LOGIN CARD */}
        <main className="w-full bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Masuk ke Akun
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Silakan masukkan username dan kata sandi Anda.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-snug text-xs font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username Input */}
            <div>
              <label htmlFor="login-username" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  className="w-full bg-slate-50/80 dark:bg-[#0A1322] border border-slate-300 dark:border-[#1E3048] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#0A1322] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50/80 dark:bg-[#0A1322] border border-slate-300 dark:border-[#1E3048] rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#0A1322] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Simpan Login (Persistent Session) Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 dark:bg-[#0A1322] cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Simpan sesi login
                </span>
              </label>

              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Aman</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke SIMKA.ID</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </main>

        {/* FOOTER */}
        <footer className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-5">
          SIMKA.ID &copy; 2026 — Pesantren Nurul Islam Tengaran
        </footer>

      </div>
    </div>
  );
};


