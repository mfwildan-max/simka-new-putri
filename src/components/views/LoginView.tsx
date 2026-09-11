import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle, Sparkles, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, UnitPesantren } from '../../types';

export const LoginView: React.FC = () => {
  const { login, usersList } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await login(username, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Username atau kata sandi tidak sesuai.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kendala saat menghubungkan ke sistem. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (usr: string, pass: string) => {
    setUsername(usr);
    setPassword(pass);
    setIsLoading(true);
    setErrorMsg(null);
    const res = await login(usr, pass);
    if (!res.success) {
      setErrorMsg(res.message || 'Gagal login cepat.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-900/40 mb-4 border border-emerald-400/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            SIMKA<span className="text-emerald-400">.ID</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
            Sistem Monitoring Karakter & Akhlak Santri
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 font-medium">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unit SMP • MA • SMA</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#131E32]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Masuk ke Akun</h2>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan kredensial akun SIMKA resmi untuk mengakses dashboard unit Anda.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: koor.ma, musyrif.smp1"
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  className="w-full bg-[#0B1120]/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#0B1120]/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher / Preset Accounts for reviewers */}
          <div className="mt-7 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold tracking-wide uppercase text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Cepat Akun Uji Coba:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Kasie Superadmin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('kasie', 'admin123')}
                className="p-2 text-left rounded-lg bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group col-span-2 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-emerald-400 text-xs">Kasie Kepesantrenan (Superadmin)</div>
                  <div className="text-[11px] text-slate-400">Semua Unit (SMP, MA, SMA) • kasie / admin123</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Global</span>
              </button>

              {/* Koordinator MA */}
              <button
                type="button"
                onClick={() => handleQuickLogin('koor.ma', 'ma123')}
                className="p-2 text-left rounded-lg bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="font-medium text-slate-200 text-xs truncate">Koordinator MA</div>
                <div className="text-[10px] text-slate-400">koor.ma / ma123</div>
              </button>

              {/* Musyrif MA */}
              <button
                type="button"
                onClick={() => handleQuickLogin('musyrif.ma1', 'ma123')}
                className="p-2 text-left rounded-lg bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="font-medium text-slate-200 text-xs truncate">Musyrif MA</div>
                <div className="text-[10px] text-slate-400">musyrif.ma1 / ma123</div>
              </button>

              {/* Koordinator SMP */}
              <button
                type="button"
                onClick={() => handleQuickLogin('koor.smp', 'smp123')}
                className="p-2 text-left rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="font-medium text-slate-200 text-xs truncate">Koordinator SMP</div>
                <div className="text-[10px] text-slate-400">koor.smp / smp123</div>
              </button>

              {/* Musyrif SMP */}
              <button
                type="button"
                onClick={() => handleQuickLogin('musyrif.smp1', 'smp123')}
                className="p-2 text-left rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="font-medium text-slate-200 text-xs truncate">Musyrif SMP</div>
                <div className="text-[10px] text-slate-400">musyrif.smp1 / smp123</div>
              </button>

              {/* Koordinator SMA */}
              <button
                type="button"
                onClick={() => handleQuickLogin('koor.sma', 'sma123')}
                className="p-2 text-left rounded-lg bg-slate-900/70 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="font-medium text-slate-200 text-xs truncate">Koordinator SMA</div>
                <div className="text-[10px] text-slate-400">koor.sma / sma123</div>
              </button>

              {/* Musyrif SMA */}
              <button
                type="button"
                onClick={() => handleQuickLogin('musyrif.sma1', 'sma123')}
                className="p-2 text-left rounded-lg bg-slate-900/70 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="font-medium text-slate-200 text-xs truncate">Musyrif SMA</div>
                <div className="text-[10px] text-slate-400">musyrif.sma1 / sma123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          SIMKA.ID &copy; 2026 — Keamanan Data & Isolasi Unit Berbasis Role.
        </p>
      </div>
    </div>
  );
};
