import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  Search
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
    getTopPelanggaran,
    getRecentActivities,
    setSelectedSantriForDetail,
    setCurrentRoute
  } = useApp();

  const [selectedYear, setSelectedYear] = useState('2026');

  const monthlyData = getMonthlyData();
  const donutData = getDonutData();
  const topSantri = getTop5Santri();
  const topPelanggaran = getTopPelanggaran();
  const recentActivities = getRecentActivities();

  // Color palette for Donut Chart
  const DONUT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* BANNER DASHBOARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 p-6 sm:p-8 text-white shadow-lg border border-emerald-600/30">
        {/* Background Islamic Geometric Accent */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <MosqueLogoIcon className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white tracking-wider uppercase border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>SIMKA.ID</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
              Sistem Monitoring Karakter & Akhlak Santri
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed italic font-medium">
              &ldquo;Mencatat, Memantau, Membina — untuk Generasi Qur&apos;ani yang Berakhlak Mulia&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentRoute('catat-pelanggaran')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Catat Pelanggaran</span>
            </button>
            <button
              onClick={() => setCurrentRoute('rekap-pelanggaran')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-950/80 text-white border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Lihat Rekap Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: PELANGGARAN HARI INI */}
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pelanggaran Hari Ini
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.pelanggaranHariIni}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Catatan masuk hari ini
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: TOTAL SANTRI TERDAFTAR */}
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Santri Terdaftar
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalSantri}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              Santri aktif terdata
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: BELUM SELESAI */}
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Belum Selesai
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.belumSelesai}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Kasus butuh tindak lanjut
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: TERSELESAIKAN */}
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Terseelesaikan
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.terseelesaikan}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              Tindakan tuntas terlaksana
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: GRAFIK JUMLAH PELANGGARAN PER BULAN */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Grafik Jumlah Pelanggaran Per Bulan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Frekuensi pencatatan pelanggaran santri berdasarkan data aktual
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="bulan" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1C32',
                    borderColor: '#1E3048',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#34D399' }}
                />
                <Bar dataKey="jumlah" name="Kasus" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: DISTRIBUSI PELANGGARAN ANTAR UNIT */}
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Distribusi Pelanggaran Antar Unit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proporsi data aktual santri (SMP, MA, SMA)
            </p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Proporsi']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#1C2F4D] flex items-center justify-between text-xs text-slate-500">
            <span>Sinkronisasi Data</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Database Supabase</span>
          </div>
        </div>
      </div>

      {/* TABEL DASHBOARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabel 1: PELANGGARAN TERBANYAK */}
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Pelanggaran Terbanyak
              </h3>
            </div>
            <button
              onClick={() => setCurrentRoute('data-pelanggaran')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg text-center w-8">No</th>
                  <th className="py-2.5 px-3">Jenis Pelanggaran</th>
                  <th className="py-2.5 px-3 text-center">Jumlah</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1C2F4D]">
                {topPelanggaran.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      Belum ada data pelanggaran tercatat.
                    </td>
                  </tr>
                ) : (
                  topPelanggaran.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#15253F] transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {item.nama}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.count}x
                      </td>
                      <td className="py-3 px-3 text-right font-black text-rose-500">
                        +{item.totalPoin}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel 2: SANTRI DENGAN POIN TERTINGGI */}
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Santri Poin Tertinggi
              </h3>
            </div>
            <button
              onClick={() => setCurrentRoute('data-santri')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg text-center w-8">No</th>
                  <th className="py-2.5 px-3">Nama Santri</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1C2F4D]">
                {topSantri.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      Tidak ada data santri.
                    </td>
                  </tr>
                ) : (
                  topSantri.map((s, idx) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSantriForDetail(s)}
                      className="hover:bg-slate-50 dark:hover:bg-[#15253F] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {s.nama}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          NIS: {s.nis}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {s.kelas}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1C2F4D] text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                          {s.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                        {s.totalPoin} Poin
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel 3: AKTIVITAS TERBARU */}
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Aktivitas Terbaru
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                Live
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  Belum ada rekaman log aktivitas.
                </p>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1322] border border-slate-100 dark:border-[#18283E]">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {act.title}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        Unit {act.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {act.desc}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
                      {act.timeFormatted}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#1C2F4D] text-center">
            <button
              onClick={() => setCurrentRoute('rekap-pelanggaran')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Buka Seluruh Rekap Log →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
