import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PointBadge } from '../common/PointBadge';
import { UnitPesantren, PelanggaranKategori } from '../../types';
import { exportRiwayatPelanggaranPDF, getOfficialKategori } from '../../lib/exportPelanggaranPdf';
import {
  Search,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  GraduationCap,
  Download,
  Filter,
  Calendar,
  Building2,
  Layers,
  RotateCcw
} from 'lucide-react';

export const RekapPelanggaranView: React.FC = () => {
  const { user, riwayatList, toggleStatusPelanggaran, santriList, setSelectedSantriForDetail, showToast } = useApp();
  
  const isSuperadmin = user?.role === 'KASIE_KEPESANTRENAN';
  const isKoordinator = user?.role === 'KOORDINATOR';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    isSuperadmin ? 'ALL' : user?.unit || 'ALL'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Belum Selesai' | 'Selesai'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return riwayatList.filter((log) => {
      // 1. Search match
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.santriNama.toLowerCase().includes(q) ||
        log.jenisPelanggaranNama.toLowerCase().includes(q) ||
        log.santriKelas.toLowerCase().includes(q) ||
        (log.hukuman && log.hukuman.toLowerCase().includes(q)) ||
        (log.catatan && log.catatan.toLowerCase().includes(q));

      // 2. Unit match
      const matchUnit =
        selectedUnit === 'ALL' ||
        log.santriUnit === selectedUnit;

      // 3. Category match
      const calculatedKategori = getOfficialKategori(log.poin).label;
      const matchCategory =
        selectedCategory === 'All' ||
        calculatedKategori === selectedCategory ||
        (log as any).kategori === selectedCategory;

      // 4. Status match
      const matchStatus =
        filterStatus === 'All' ||
        log.status === filterStatus;

      // 5. Date Range match
      let matchDate = true;
      if (startDate || endDate) {
        // Date strings in log.tanggal might be 'YYYY-MM-DD' or 'DD/MM/YYYY' or ISO
        const logDateStr = log.tanggal ? log.tanggal.slice(0, 10) : '';
        if (startDate && logDateStr && logDateStr < startDate) {
          matchDate = false;
        }
        if (endDate && logDateStr && logDateStr > endDate) {
          matchDate = false;
        }
      }

      return matchSearch && matchUnit && matchCategory && matchStatus && matchDate;
    });
  }, [riwayatList, searchQuery, selectedUnit, selectedCategory, filterStatus, startDate, endDate]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleExportPDF = () => {
    if (filteredLogs.length === 0) {
      showToast('Data Kosong', 'Tidak ada data riwayat pelanggaran untuk diekspor ke PDF.', 'warning');
      return;
    }

    try {
      exportRiwayatPelanggaranPDF(filteredLogs, {
        unitFilter: selectedUnit,
        statusFilter: filterStatus,
        searchQuery: searchQuery,
        userRole: user?.role,
        userName: user?.nama
      });

      showToast(
        'PDF Berhasil Dibuat',
        `Laporan PDF Riwayat Pelanggaran (${filteredLogs.length} data) berhasil diunduh.`,
        'success'
      );
    } catch (err: any) {
      console.error('[EXPORT PDF ERROR]', err);
      showToast('Gagal Membuat PDF', err?.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    if (isSuperadmin) setSelectedUnit('ALL');
    setSelectedCategory('All');
    setFilterStatus('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold tracking-wider mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Rekam Jejak Kedisiplinan • {user ? (isSuperadmin ? (selectedUnit === 'ALL' ? 'Semua Unit' : `Unit ${selectedUnit}`) : `Unit ${user.unit}`) : ''}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Rekap Riwayat Pelanggaran
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              Riwayat kronologis pencatatan pelanggaran santri, poin kumulatif, dan status tindak lanjut pembinaan.
            </p>
          </div>

          <button
            id="btn-export-pdf-rekap"
            onClick={handleExportPDF}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto active:scale-95"
            title="Export Rekap Pelanggaran ke Dokumen PDF A4 Standar"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export PDF</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              {filteredLogs.length} Data
            </span>
          </button>
        </div>
      </div>

      {/* Interactive Filters Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama santri, kelas, pelanggaran, atau sanksi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Unit Filter (Kasie / Koordinator) */}
          {(isSuperadmin || isKoordinator) && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] self-start lg:self-auto shrink-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              {(['ALL', 'SMP', 'MA', 'SMA'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => {
                    setSelectedUnit(unit);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedUnit === unit
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {unit === 'ALL' ? 'Semua Unit' : unit}
                </button>
              ))}
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] self-start lg:self-auto shrink-0">
            {(['All', 'Belum Selesai', 'Selesai'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-white dark:bg-[#182C4C] text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {status === 'All' ? 'Semua Status' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Category, Date Range & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-[#182740] text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="All">Semua Kategori</option>
                <option value="Sangat Ringan">Sangat Ringan (5-49)</option>
                <option value="Ringan">Ringan (50-69)</option>
                <option value="Sedang">Sedang (70-89)</option>
                <option value="Berat">Berat (90-99)</option>
                <option value="Sangat Berat">Sangat Berat (100+)</option>
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Dari"
                className="bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] rounded-xl px-2.5 py-1 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Sampai"
                className="bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] rounded-xl px-2.5 py-1 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Reset Filters */}
          {(searchQuery || (isSuperadmin && selectedUnit !== 'ALL') || selectedCategory !== 'All' || filterStatus !== 'All' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#182740]">
              <tr>
                <th className="py-2.5 px-3.5">TGL / WAKTU</th>
                <th className="py-2.5 px-3.5">NAMA SANTRI</th>
                <th className="py-2.5 px-3.5">KELAS & UNIT</th>
                <th className="py-2.5 px-3.5">JENIS PELANGGARAN</th>
                <th className="py-2.5 px-3.5 text-center">POIN</th>
                <th className="py-2.5 px-3.5 text-center">KATEGORI</th>
                <th className="py-2.5 px-3.5">SANKSI / KONSEKUENSI</th>
                <th className="py-2.5 px-3.5 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#182740] text-slate-800 dark:text-slate-200">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                    <p className="font-bold text-slate-600 dark:text-slate-300">Tidak ada catatan pelanggaran ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter yang aktif.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const santri = santriList.find((s) => s.id === log.santriId || s.nama === log.santriNama);
                  const kategoriInfo = getOfficialKategori(log.poin);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#13223A] transition-colors group"
                    >
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {log.tanggal}
                      </td>

                      <td
                        onClick={() => santri && setSelectedSantriForDetail(santri)}
                        className="py-2.5 px-3.5 max-w-[180px] cursor-pointer"
                      >
                        <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={log.santriNama}>
                          {log.santriNama}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#132138] border border-slate-200 dark:border-[#1E2E4A] font-bold text-[10px] text-slate-700 dark:text-slate-300">
                          <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {log.santriKelas} ({log.santriUnit})
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 max-w-[220px]">
                        <div className="font-semibold text-slate-900 dark:text-white truncate leading-snug" title={log.jenisPelanggaranNama}>
                          {log.jenisPelanggaranNama}
                        </div>
                        {log.catatan && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate" title={log.catatan}>
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{log.catatan}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <PointBadge points={log.poin} size="sm" />
                      </td>

                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            color: `rgb(${kategoriInfo.textColor.join(',')})`,
                            backgroundColor: `rgb(${kategoriInfo.bgColor.join(',')})`
                          }}
                        >
                          {kategoriInfo.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 max-w-[180px] text-slate-600 dark:text-slate-300 text-[11px] truncate" title={log.hukuman || '-'}>
                        {log.hukuman || '-'}
                      </td>

                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleStatusPelanggaran(log.id)}
                          title="Klik untuk ubah status penyelesaian"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                            log.status === 'Selesai'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/40 hover:bg-emerald-100'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/40 hover:bg-amber-100'
                          }`}
                        >
                          {log.status === 'Selesai' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{log.status}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-[#182740] bg-slate-50 dark:bg-[#0B1322] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> sampai{' '}
            <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari{' '}
            <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length}</span> log pelanggaran
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15233C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="font-bold text-slate-800 dark:text-slate-200 px-2 text-[11px]">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15233C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
