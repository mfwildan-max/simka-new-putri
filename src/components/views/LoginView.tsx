import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MosqueLogo } from '../common/MosqueLogo';

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
      setErrorMsg('Gagal masuk ke sistem. Silakan periksa username dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await login(username.trim(), password, rememberMe);
      if (!res.success) {
        setErrorMsg('Gagal masuk ke sistem. Silakan periksa username dan kata sandi.');
      }
    } catch {
      setErrorMsg('Gagal masuk ke sistem. Silakan periksa username dan kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#06110F] via-[#0B1714] to-[#101A18] text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 select-none font-sans overflow-x-hidden">
      {/* Top spacing */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto py-6 max-w-md mx-auto">
        
        {/* ============================================================ */}
        {/* BRANDING HEADER */}
        {/* ============================================================ */}
        <header className="w-full text-center mb-6 flex flex-col items-center">
          {/* LOGO MASJID PREMIUM */}
          <div className="mb-4">
            <div className="p-3.5 rounded-3xl bg-gradient-to-b from-[#0D241E] to-[#081714] border border-[#00B686]/30 shadow-2xl shadow-emerald-950/60 flex items-center justify-center">
              <MosqueLogo size="xl" className="w-14 h-14 sm:w-16 sm:h-16" />
            </div>
          </div>

          {/* SIMKA.ID TITLE */}
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-[26px] sm:text-[32px] font-black tracking-tight text-white leading-tight">
              SIMKA<span className="text-[#00B686]">.ID</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-[#00B686]/15 text-[#00B686] border border-[#00B686]/30 tracking-wider">
              Pro V1
            </span>
          </div>

          {/* TAGLINE */}
          <p className="text-[13px] sm:text-[14.5px] font-semibold text-emerald-300/90 mt-1 max-w-xs sm:max-w-md leading-relaxed tracking-wide">
            Sistem Monitoring Karakter &amp; Akhlak Santri
          </p>

          {/* NAMA PESANTREN */}
          <p className="text-[11px] sm:text-[12.5px] font-bold text-[#F4B942] tracking-widest uppercase mt-1">
            PESANTREN NURUL ISLAM TENGARAN
          </p>
        </header>

        {/* ============================================================ */}
        {/* LOGIN CARD */}
        {/* ============================================================ */}
        <main className="w-full bg-gradient-to-b from-[#0D1F1A]/95 to-[#091512]/95 border border-[#00B686]/25 rounded-2xl p-5 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur-md">
          {/* Card Header */}
          <div className="mb-5 text-center sm:text-left">
            <h2 className="text-[17px] sm:text-[19px] font-bold text-white tracking-tight">
              Masuk ke Sistem
            </h2>
            <p className="text-[12px] sm:text-[13px] text-slate-400 mt-1 leading-relaxed">
              Gunakan username dan kata sandi Anda untuk mengakses sistem.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug text-[12px] font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: USERNAME PENGGUNA */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-[11.5px] sm:text-[12px] font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5"
              >
                USERNAME PENGGUNA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-emerald-400/70" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  className="w-full bg-[#071310] border border-[#16352C] rounded-xl pl-10 pr-3.5 py-2.5 sm:py-3 text-[13px] sm:text-[14px] text-white placeholder-slate-500 focus:outline-none focus:bg-[#071310] focus:border-[#00B686] focus:ring-2 focus:ring-[#00B686]/25 transition-all font-medium"
                />
              </div>
            </div>

            {/* Field 2: KATA SANDI */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-[11.5px] sm:text-[12px] font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5"
              >
                KATA SANDI
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-emerald-400/70" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#071310] border border-[#16352C] rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-[13px] sm:text-[14px] text-white placeholder-slate-500 focus:outline-none focus:bg-[#071310] focus:border-[#00B686] focus:ring-2 focus:ring-[#00B686]/25 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* INGAT SAYA (Persistent Session) */}
            <div className="flex items-center justify-between pt-1">
              <label htmlFor="remember-me" className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#00A878] border-[#16352C] bg-[#071310] focus:ring-[#00A878] focus:ring-offset-0 cursor-pointer accent-[#00A878]"
                />
                <div className="flex flex-col">
                  <span className="text-[12.5px] text-slate-200 font-semibold">
                    Ingat Saya
                  </span>
                  <span className="text-[10.5px] text-slate-400">
                    Tetap masuk di perangkat ini
                  </span>
                </div>
              </label>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#00B686] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F4B942]" />
                <span>Terlindungi</span>
              </span>
            </div>

            {/* BUTTON LOGIN */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 h-[44px] sm:h-[48px] flex items-center justify-center gap-2 px-4 rounded-xl bg-gradient-to-r from-[#00A878] to-[#00B686] hover:from-[#00966a] hover:to-[#00a377] active:scale-[0.99] text-white font-bold text-[13px] sm:text-[14px] shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke SIMKA.ID</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </main>

      </div>

      {/* ============================================================ */}
      {/* FOOTER LOGIN */}
      {/* ============================================================ */}
      <footer className="w-full text-center text-slate-400 text-[11px] sm:text-[12px] py-4 space-y-0.5">
        <p className="font-semibold text-slate-300">
          SIMKA.ID Pro V1 &bull; Dikelola Oleh Bidang Akhlak dan Karakter
        </p>
        <p className="text-slate-400">
          Kepesantrenan Nurul Islam Tengaran
        </p>
      </footer>
    </div>
  );
};
