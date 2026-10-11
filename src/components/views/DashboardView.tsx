import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PointBadge } from '../common/PointBadge';
import {
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Building2,
  Activity,
  Plus,
  Sparkles,
  ClipboardList,
  Flame,
  Search,
  UserCheck,
  Eye,
  GraduationCap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { MosqueLogoIcon } from '../layout/IslamicPattern';

export const DashboardView: React.FC = () => {
  const {
    stats,
    user,
    getMonthlyData,
    getDonutData,
    getTop5Santri,
    getDashboardSantriBinaan,
    getTopPelanggaran,
    getRecentActivities,
    setSelectedSantriForDetail,
    setCurrentRoute
  } = useApp();

  const [selectedYear, setSelectedYear] = useState('2026');

  const monthlyData = getMonthlyData();
  const donutData = getDonutData();
  const topSantri = getTop5Santri();
  const dashboardBinaan = getDashboardSantriBinaan();
  const topPelanggaran = getTopPelanggaran();
  const recentActivities = getRecentActivities();

  // Color palette for Donut Chart
  const DONUT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* BANNER DASHBOARD */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 p-4 sm:p-8 text-white shadow-lg border border-emerald-600/30">
        {/* Background Islamic Geometric Accent */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <MosqueLogoIcon className="w-48 sm:w-64 h-48 sm:h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-white/15 backdrop-blur-md text-[10.5px] sm:text-xs font-bold text-white tracking-wider uppercase border border-white/20">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" />
              <span>SIMKA.ID</span>
            </div>

            <h2 className="text-lg sm:text-3xl font-black tracking-tight text-white leading-snug">
              Sistem Monitoring Karakter & Akhlak Santri
            </h2>

            <p className="text-[11.5px] sm:text-sm text-emerald-100 max-w-2xl leading-relaxed italic font-medium">
              &ldquo;Mencatat, Memantau, Membina — untuk Generasi Qur&apos;ani yang Berakhlak Mulia&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-0">
            <button
              onClick={() => setCurrentRoute('catat-pelanggaran')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-[11px] sm:text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
              <span>Catat Pelanggaran</span>
            </button>
            <button
              onClick={() => setCurrentRoute('rekap-pelanggaran')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-emerald-950/60 hover:bg-emerald-950/80 text-white border border-emerald-500/40 text-[11px] sm:text-xs font-bold transition-all cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Lihat Rekap Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: PELANGGARAN HARI INI */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-3.5 sm:p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pelanggaran Hari Ini
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">
              {stats.pelanggaranHariIni}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 truncate">
              Catatan masuk hari ini
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 ml-1.5">
            <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* KPI 2: TOTAL SANTRI TERDAFTAR */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-3.5 sm:p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Santri
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">
              {stats.totalSantri}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 font-semibold truncate">
              Santri aktif terdata
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 ml-1.5">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* KPI 3: BELUM SELESAI */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-3.5 sm:p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Belum Selesai
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">
              {stats.belumSelesai}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 truncate">
              Butuh tindak lanjut
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 ml-1.5">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* KPI 4: TERSELESAIKAN */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-3.5 sm:p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Terseelesaikan
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">
              {stats.terseelesaikan}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 font-semibold truncate">
              Tindakan tuntas
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 ml-1.5">
            <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {/* Chart 1: GRAFIK JUMLAH PELANGGARAN PER BULAN */}
        <div className="lg:col-span-2 rounded-xl sm:rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-3.5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                Grafik Jumlah Pelanggaran Per Bulan
              </h3>
              <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Frekuensi pencatatan pelanggaran santri berdasarkan data aktual
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-[11px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>
            </div>
          </div>

          <div className="h-52 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="bulan" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1C32',
                    borderColor: '#1E3048',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '11px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#34D399' }}
                />
                <Bar dataKey="jumlah" name="Kasus" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: DISTRIBUSI PELANGGARAN ANTAR UNIT */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-3.5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
              Distribusi Pelanggaran Antar Unit
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proporsi data aktual santri (SMP, MA, SMA)
            </p>
          </div>

          <div className="h-44 sm:h-56 w-full my-1 sm:my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1C32',
                    borderColor: '#1E3048',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '11px'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Proporsi']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={(value) => (
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#1C2F4D] flex items-center justify-between text-[10.5px] sm:text-xs text-slate-500">
            <span>Sinkronisasi Data</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Database Supabase</span>
          </div>
        </div>
      </div>

      {/* TABEL DASHBOARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
        {/* Tabel 1: PELANGGARAN TERBANYAK */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-3.5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                  Pelanggaran Terbanyak
                </h3>
              </div>
              <button
                onClick={() => setCurrentRoute('data-pelanggaran')}
                className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 sm:gap-1 cursor-pointer"
              >
                <span>Semua</span>
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-[11px] sm:text-xs">
                <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9.5px] sm:text-[10px]">
                  <tr>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 rounded-l-lg text-center w-7 sm:w-8">No</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Jenis Pelanggaran</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">Jumlah</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-right rounded-r-lg whitespace-nowrap">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1C2F4D]">
                  {topPelanggaran.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-5 sm:py-6 text-center text-slate-400 italic text-[11px] sm:text-xs">
                        Belum ada data pelanggaran.
                      </td>
                    </tr>
                  ) : (
                    topPelanggaran.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#15253F] transition-colors">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                          {item.nama}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {item.count}x
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-right font-black text-rose-500 whitespace-nowrap">
                          +{item.totalPoin}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t border-slate-100 dark:border-[#1C2F4D] text-center">
            <button
              onClick={() => setCurrentRoute('data-pelanggaran')}
              className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Lihat Master Kamus Pelanggaran →
            </button>
          </div>
        </div>

        {/* Tabel 2: ANAK BINAAN — RINGKASAN POIN */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-3.5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                    ANAK BINAAN — RINGKASAN POIN
                  </h3>
                </div>
                {dashboardBinaan.subtitle && (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium italic">
                    {dashboardBinaan.subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={() => setCurrentRoute('data-santri')}
                className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Lihat Semua</span>
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>

            {/* MOBILE ONLY (screen < 640px): Compact Cards Layout (Pilihan Utama - Tanpa Scroll Horizontal) */}
            <div className="sm:hidden space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
              {dashboardBinaan.santri.length === 0 ? (
                <div className="py-6 text-center text-slate-400 italic text-[11px]">
                  Tidak ada data santri pada unit ini.
                </div>
              ) : (
                dashboardBinaan.santri.map((s, idx) => {
                  const kamar = (s.kamar || '').trim();
                  const asrama = (s.asrama || '').trim();
                  let kamarDisplay = '—';
                  if (kamar && asrama) {
                    const cleanAsrama = asrama.replace(/^Asrama\s+/i, '').trim();
                    kamarDisplay = kamar.toLowerCase().includes(cleanAsrama.toLowerCase())
                      ? kamar
                      : `${cleanAsrama} ${kamar}`;
                  } else if (kamar) {
                    kamarDisplay = kamar;
                  } else if (asrama) {
                    kamarDisplay = asrama.replace(/^Asrama\s+/i, '').trim() || asrama;
                  }

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSantriForDetail(s)}
                      className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#0A1322]/80 border border-slate-200/70 dark:border-[#1A2D48] hover:border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      {/* Baris 1: No, Nama, dan NIS */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-200/70 dark:bg-[#162740] flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-[11.5px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                              {s.nama}
                            </h4>
                            <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                              NIS: {s.nis}
                            </p>
                          </div>
                        </div>

                        {/* Total Poin */}
                        <div className="shrink-0">
                          <PointBadge points={s.totalPoin} size="sm" />
                        </div>
                      </div>

                      {/* Baris 2: Kelas/Unit, Kamar, dan Tombol Detail */}
                      <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-[#162740] flex items-center justify-between gap-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#132138] border border-slate-200 dark:border-[#1E2E4A] font-bold text-slate-700 dark:text-slate-300">
                            <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{s.kelas} ({s.unit})</span>
                          </span>

                          <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[110px]" title={kamarDisplay}>
                            Kamar: <strong className="text-slate-800 dark:text-slate-200">{kamarDisplay}</strong>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSantriForDetail(s);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1 shrink-0"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP & TABLET (screen >= 640px): Standard Table Layout */}
            <div className="hidden sm:block overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg text-center w-8">No</th>
                    <th className="py-2.5 px-3">Nama Santri</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Kelas / Unit</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Kamar</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Total Poin</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1C2F4D]">
                  {dashboardBinaan.santri.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Tidak ada data santri pada unit ini.
                      </td>
                    </tr>
                  ) : (
                    dashboardBinaan.santri.map((s, idx) => {
                      const kamar = (s.kamar || '').trim();
                      const asrama = (s.asrama || '').trim();
                      let kamarDisplay = '—';
                      if (kamar && asrama) {
                        const cleanAsrama = asrama.replace(/^Asrama\s+/i, '').trim();
                        kamarDisplay = kamar.toLowerCase().includes(cleanAsrama.toLowerCase())
                          ? kamar
                          : `${cleanAsrama} ${kamar}`;
                      } else if (kamar) {
                        kamarDisplay = kamar;
                      } else if (asrama) {
                        kamarDisplay = asrama.replace(/^Asrama\s+/i, '').trim() || asrama;
                      }

                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedSantriForDetail(s)}
                          className="hover:bg-slate-50 dark:hover:bg-[#15253F] transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 min-w-[140px] max-w-[200px]">
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate" title={s.nama}>
                              {s.nama}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              NIS: {s.nis}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#132138] border border-slate-200 dark:border-[#1E2E4A] font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{s.kelas} ({s.unit})</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {kamarDisplay !== '—' ? (
                              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                {kamarDisplay}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <PointBadge points={s.totalPoin} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              title="Lihat Detail Rekam Jejak"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSantriForDetail(s);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-bold text-[11px] transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t border-slate-100 dark:border-[#1C2F4D] text-center">
            <button
              onClick={() => setCurrentRoute('data-santri')}
              className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Lihat Semua Santri Binaan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
