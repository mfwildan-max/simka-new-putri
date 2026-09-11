import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Pelanggaran, PelanggaranKategori } from '../../types';
import { KategoriPelanggaranBadge } from '../common/PointBadge';
import { AddPelanggaranModal } from '../common/AddPelanggaranModal';
import { EditPelanggaranModal } from '../common/EditPelanggaranModal';
import { ImportPelanggaranModal } from '../common/ImportPelanggaranModal';
import { DeletePelanggaranModal } from '../common/DeletePelanggaranModal';
import { DeleteAllPelanggaranModal } from '../common/DeleteAllPelanggaranModal';
import { 
  exportPelanggaranToExcel, 
  generatePelanggaranExcelTemplate 
} from '../../lib/excelHelper';
import {
  BookOpen,
  Search,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  ShieldAlert,
  Sparkles,
  Layers,
  FileDown,
  AlertOctagon,
  AlertTriangle
} from 'lucide-react';

type CategoryFilter = 'All' | PelanggaranKategori;

export const DataPelanggaranView: React.FC = () => {
  const { pelanggaranList, user, showToast } = useApp();

  const isKasie = user?.role === 'KASIE_KEPESANTRENAN';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [editingPelanggaran, setEditingPelanggaran] = useState<Pelanggaran | null>(null);
  const [deletingPelanggaran, setDeletingPelanggaran] = useState<Pelanggaran | null>(null);

  // Quick stats
  const stats = useMemo(() => {
    let sangatRingan = 0;
    let ringan = 0;
    let sedang = 0;
    let berat = 0;
    let sangatBerat = 0;

    for (const p of pelanggaranList) {
      if (p.poin >= 100) sangatBerat++;
      else if (p.poin >= 90) berat++;
      else if (p.poin >= 70) sedang++;
      else if (p.poin >= 50) ringan++;
      else sangatRingan++;
    }

    return {
      total: pelanggaranList.length,
      sangatRingan,
      ringan,
      sedang,
      berat,
      sangatBerat
    };
  }, [pelanggaranList]);

  // Filter list
  const filteredPelanggaran = useMemo(() => {
    return pelanggaranList.filter((item) => {
      const matchSearch =
        item.jenis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.konsekuensi.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'All' || item.kategori === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [pelanggaranList, searchQuery, selectedCategory]);

  const handleDownloadTemplate = () => {
    if (!isKasie) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang berwenang mengunduh template.', 'error');
      return;
    }
    try {
      generatePelanggaranExcelTemplate();
      showToast('Template Diunduh', 'Template Excel Master Pelanggaran siap digunakan.', 'info');
    } catch (err: any) {
      showToast('Gagal Mengunduh', err.message || 'Terjadi kesalahan.', 'error');
    }
  };

  const handleExport = () => {
    if (!isKasie) {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang berwenang mengekspor data master.', 'error');
      return;
    }
    if (pelanggaranList.length === 0) {
      showToast('Data Kosong', 'Tidak ada data master pelanggaran untuk diekspor.', 'warning');
      return;
    }

    try {
      exportPelanggaranToExcel(pelanggaranList, 'Master_Data_Pelanggaran', user?.role);
      showToast('Ekspor Berhasil', 'Data Master Pelanggaran berhasil diunduh sebagai file Excel.', 'success');
    } catch (err: any) {
      showToast('Gagal Ekspor', err.message || 'Terjadi kesalahan saat mengekspor data.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold tracking-wider mb-2.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Master Kamus Tata Tertib</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Data Master Pelanggaran
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Daftar rujukan resmi jenis pelanggaran kedisiplinan santri, bobot penambahan poin, kategori otomatis terstandar, dan sanksi edukatif.
            </p>
          </div>

          {/* Action Buttons Toolbar (Only for Kasie) */}
          {isKasie && (
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <button
                id="btn-open-add-pelanggaran"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tambah Pelanggaran</span>
              </button>

              <button
                id="btn-open-import-pelanggaran"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </button>

              <button
                id="btn-download-pelanggaran-template"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/15 transition-all cursor-pointer"
                title="Download Template Format Excel"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>

              <button
                id="btn-export-pelanggaran-excel"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/15 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              {pelanggaranList.length > 0 && (
                <button
                  id="btn-open-delete-all-master"
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                  title="Hapus / Reset Seluruh Master Pelanggaran (Hanya Kasie)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua Master</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metric Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101C2F] border border-slate-200/80 dark:border-[#1E3048] shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Jenis</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Sangat Ringan</div>
          <div className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5">{stats.sangatRingan}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30">
          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Ringan</div>
          <div className="text-xl font-black text-blue-800 dark:text-blue-300 mt-0.5">{stats.ringan}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Sedang</div>
          <div className="text-xl font-black text-amber-800 dark:text-amber-300 mt-0.5">{stats.sedang}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/30">
          <div className="text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Berat</div>
          <div className="text-xl font-black text-orange-800 dark:text-orange-300 mt-0.5">{stats.berat}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/30">
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Sangat Berat</div>
          <div className="text-xl font-black text-rose-800 dark:text-rose-300 mt-0.5">{stats.sangatBerat}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-input-pelanggaran"
            type="text"
            placeholder="Cari berdasarkan kode, jenis pelanggaran, atau hukuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3048] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          {(
            [
              { label: 'Semua', value: 'All' },
              { label: 'Sangat Ringan (5-49)', value: 'Sangat Ringan' },
              { label: 'Ringan (50-69)', value: 'Ringan' },
              { label: 'Sedang (70-89)', value: 'Sedang' },
              { label: 'Berat (90-99)', value: 'Berat' },
              { label: 'Sangat Berat (100+)', value: 'Sangat Berat' }
            ] as const
          ).map((filter) => {
            const isActive = selectedCategory === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setSelectedCategory(filter.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#0A1322] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1E3048] hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Violations Catalog Table or Empty State */}
      {pelanggaranList.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Belum ada data master pelanggaran.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Kamus tata tertib dan master pelanggaran saat ini kosong. Anda dapat menambahkan jenis pelanggaran baru secara manual atau mengimpor file Excel.
          </p>

          {isKasie && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                id="btn-empty-add-pelanggaran"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Tambah Pelanggaran</span>
              </button>

              <button
                id="btn-empty-import-pelanggaran"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel</span>
              </button>

              <button
                id="btn-empty-download-template"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Download Template Excel</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#101C2F] border border-slate-200/90 dark:border-[#1E3048] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-[#0A1322] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#182740]">
                <tr>
                  <th className="py-3.5 px-4 w-20">KODE</th>
                  <th className="py-3.5 px-5">ITEM PELANGGARAN</th>
                  <th className="py-3.5 px-4 w-36">KATEGORI</th>
                  <th className="py-3.5 px-4 w-28 text-center">BOBOT POIN</th>
                  <th className="py-3.5 px-5">HUKUMAN / KONSEKUENSI</th>
                  {isKasie && <th className="py-3.5 px-4 w-28 text-center">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#182740] text-slate-700 dark:text-slate-200">
                {filteredPelanggaran.length === 0 ? (
                  <tr>
                    <td colSpan={isKasie ? 6 : 5} className="py-12 text-center text-slate-400 italic">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Tidak ada jenis pelanggaran yang cocok</p>
                      <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPelanggaran.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#13223A] transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {item.kode}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                        {item.jenis}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <KategoriPelanggaranBadge kategori={item.kategori} poin={item.poin} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm font-mono">
                          +{item.poin}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.konsekuensi || '-'}
                      </td>
                      {isKasie && (
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-edit-pelanggaran-${item.id}`}
                              type="button"
                              onClick={() => setEditingPelanggaran(item)}
                              title="Edit Data Pelanggaran"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-pelanggaran-${item.id}`}
                              type="button"
                              onClick={() => setDeletingPelanggaran(item)}
                              title="Hapus Data Pelanggaran"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPelanggaranModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditPelanggaranModal
        isOpen={!!editingPelanggaran}
        pelanggaran={editingPelanggaran}
        onClose={() => setEditingPelanggaran(null)}
      />

      <ImportPelanggaranModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <DeletePelanggaranModal
        isOpen={!!deletingPelanggaran}
        pelanggaran={deletingPelanggaran}
        onClose={() => setDeletingPelanggaran(null)}
      />

      <DeleteAllPelanggaranModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
      />
    </div>
  );
};
