import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import {
  Menu,
  Search,
  Bell,
  Building2,
  Calendar,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  X,
  User,
  Shield,
  LogOut,
  ExternalLink,
  Database,
  Radio
} from 'lucide-react';
import { UnitFilter } from '../../types';
import { getRoleDisplayName } from '../../lib/auth';

interface TopNavigationProps {
  onOpenSidebar: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ onOpenSidebar }) => {
  const {
    currentRoute,
    setCurrentRoute,
    user,
    logout,
    selectedKasieUnitFilter,
    setSelectedKasieUnitFilter,
    allSantriList,
    pelanggaranList,
    setSelectedSantriForDetail,
    getRecentActivities,
    openDatabaseModal,
    isOfflineMode,
    isSupabaseOnline
  } = useApp();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { santri: [], pelanggaran: [] };
    const q = searchQuery.toLowerCase();
    const matchedSantri = allSantriList
      .filter((s) => s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q))
      .slice(0, 5);
    const matchedPelanggaran = pelanggaranList
      .filter((p) => p.jenis.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q))
      .slice(0, 4);
    return { santri: matchedSantri, pelanggaran: matchedPelanggaran };
  }, [searchQuery, allSantriList, pelanggaranList]);

  // Page title mapping
  const getPageTitle = () => {
    switch (currentRoute) {
      case 'dashboard':
        return { title: 'Dashboard Monitoring', sub: 'Ringkasan data & performa kedisiplinan santri' };
      case 'data-santri':
        return { title: 'Pengelolaan Data Santri', sub: 'Master data identitas, musyrif, dan rekam jejak poin' };
      case 'catat-pelanggaran':
        return { title: 'Catat Pelanggaran Santri', sub: 'Pencatatan pelanggaran baru & rujukan tingkat pembinaan' };
      case 'input-mutabaah':
        return { title: "Input Mutaba'ah Santri", sub: 'Pencatatan mutabaah pembinaan dan ibadah santri' };
      case 'rekap-pelanggaran':
        return { title: 'Rekap Riwayat Pelanggaran', sub: 'Log histori pelanggaran santri terstruktur' };
      case 'data-pelanggaran':
      case 'kamus-pelanggaran':
        return { title: 'Kamus Master Pelanggaran', sub: 'Katalog rujukan poin pelanggaran dan konsekuensi' };
      case 'data-pembinaan':
        return { title: 'Data Pembinaan Karakter', sub: 'Daftar santri membutuhkan tindak lanjut pembinaan' };
      case 'riwayat-pembinaan':
        return { title: 'Riwayat Tindakan Pembinaan', sub: 'Monitoring penyelesaian dan cetak form pembinaan resmi' };
      case 'laporan-pembinaan':
        return { title: 'Laporan Pembinaan & Statistik', sub: 'Rekapitulasi data, cetak dokumen, dan ekspor excel' };
      case 'manajemen-user':
        return { title: 'Manajemen Pengguna Sistem', sub: 'Pengaturan akun Kasie, Koordinator, dan Musyrif' };
      case 'akun':
        return { title: 'Pengaturan Akun Saya', sub: 'Profil pengguna aktif & keamanan kata sandi' };
      default:
        return { title: 'SIMKA.ID', sub: 'Sistem Monitoring Karakter & Akhlak Santri' };
    }
  };

  const { title, sub } = getPageTitle();
  const recentActivities = getRecentActivities();

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#081221]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#162740] transition-colors duration-200">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#12233E] border border-slate-200 dark:border-[#1E3048] transition-colors"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate flex items-center gap-2">
                <span>{title}</span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tracking-wider">
                  Pro V1
                </span>
              </h1>
              <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 truncate">
                {sub}
              </p>
            </div>
          </div>

          {/* Right: Quick Search, Unit Filter, Theme Switcher, Notifications, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0E1A2D] hover:bg-slate-200/80 dark:hover:bg-[#15253F] border border-slate-200 dark:border-[#1D304E] text-slate-600 dark:text-slate-400 text-xs font-medium transition-all shadow-2xs cursor-pointer"
              title="Cari Cepat Santri / Pelanggaran (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden xl:inline">Cari santri...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-[#1A2D48] text-[10px] text-slate-500 dark:text-slate-300 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Kasie Unit Filter Selector */}
            {user?.role === 'KASIE_KEPESANTRENAN' && (
              <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#0D1829] border border-slate-200 dark:border-[#1C2F4D]">
                {(['ALL', 'SMP', 'MA', 'SMA'] as UnitFilter[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setSelectedKasieUnitFilter(u)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedKasieUnitFilter === u
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {u === 'ALL' ? 'Semua Unit' : u}
                  </button>
                ))}
              </div>
            )}

            {/* Academic Year Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>T.A 2026/2027</span>
            </div>

            {/* Database / Supabase Sync Status Button (Kasie Only) */}
            {user?.role === 'KASIE_KEPESANTRENAN' && (
              <button
                onClick={openDatabaseModal}
                title="Pengaturan & Status Database Supabase"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                  isOfflineMode
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                    : isSupabaseOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {isOfflineMode ? 'Mode Offline' : isSupabaseOnline ? 'Supabase Sync' : 'Setup DB'}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOfflineMode
                      ? 'bg-amber-500'
                      : isSupabaseOnline
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-rose-500 animate-ping'
                  }`}
                />
              </button>
            )}

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#12233E] border border-slate-200 dark:border-[#1E3048] transition-colors cursor-pointer"
                aria-label="Notifikasi & Aktivitas"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {/* Notification Popover */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[#1E3048] shadow-2xl z-50 p-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1C2F4D]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Aktivitas & Pemberitahuan
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                      Terbaru
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-[#192A45] max-h-80 overflow-y-auto mt-2">
                    {recentActivities.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        Belum ada aktivitas terbaru hari ini.
                      </p>
                    ) : (
                      recentActivities.map((act) => (
                        <div key={act.id} className="py-2.5 px-1 hover:bg-slate-50 dark:hover:bg-[#13233D] rounded-lg transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {act.title}
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              Unit {act.unit}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {act.desc}
                          </p>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 inline-block font-medium">
                            {act.timeFormatted}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Dropdown */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-[#0E1A2D] hover:bg-slate-200/70 dark:hover:bg-[#15253F] border border-slate-200 dark:border-[#1E3048] transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    {user.nama.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block max-w-[120px] truncate leading-tight">
                      {user.nama}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block leading-tight">
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[#1E3048] shadow-2xl z-50 p-2 animate-in fade-in duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-[#1C2F4D] mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.nama}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email || user.username}
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        <Building2 className="w-3 h-3" />
                        {user.unit === 'ALL' ? 'Semua Unit' : `Unit ${user.unit}`}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentRoute('akun');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#13233D] transition-colors text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Pengaturan Akun</span>
                    </button>

                    {user.role === 'KASIE_KEPESANTRENAN' && (
                      <button
                        onClick={() => {
                          setCurrentRoute('manajemen-user');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#13233D] transition-colors text-left cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span>Kelola Pengguna</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 dark:border-[#1C2F4D] my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Keluar Sistem</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[#1E3048] shadow-2xl p-4 sm:p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1C2F4D]">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pencarian Cepat SIMKA
                </h3>
              </div>
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <input
                type="text"
                autoFocus
                placeholder="Ketik nama santri, NIS, atau jenis pelanggaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#081221] border border-slate-300 dark:border-[#1E3048] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-[#1C2F4D]">
              {/* Santri Results */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Hasil Santri ({searchResults.santri.length})
                </p>
                {searchResults.santri.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Tidak ada santri yang cocok.</p>
                ) : (
                  <div className="space-y-1.5">
                    {searchResults.santri.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedSantriForDetail(s);
                          setSearchModalOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-[#12233E] cursor-pointer transition-colors border border-transparent hover:border-emerald-500/20"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {s.nama}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            NIS: {s.nis} • Kelas {s.kelas} • Unit {s.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${s.totalPoin > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {s.totalPoin} Poin
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pelanggaran Results */}
              <div className="pt-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Kamus Pelanggaran ({searchResults.pelanggaran.length})
                </p>
                {searchResults.pelanggaran.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Tidak ada aturan yang cocok.</p>
                ) : (
                  <div className="space-y-1.5">
                    {searchResults.pelanggaran.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setCurrentRoute('data-pelanggaran');
                          setSearchModalOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#12233E] cursor-pointer transition-colors"
                      >
                        <div className="pr-3">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {p.kode}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {p.jenis}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-rose-500 shrink-0">
                          +{p.poin} Poin
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
