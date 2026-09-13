import React, { useState, useRef, useMemo } from 'react';
import { read, utils } from 'xlsx';
import { useApp } from '../../context/AppContext';
import { UnitPesantren, Santri } from '../../types';
import { generateSantriExcelTemplate, SantriImportRow } from '../../lib/excelHelper';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Building,
  HelpCircle
} from 'lucide-react';

interface ImportSantriModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUnit?: UnitPesantren;
}

export const ImportSantriModal: React.FC<ImportSantriModalProps> = ({
  isOpen,
  onClose,
  defaultUnit = 'SMP'
}) => {
  const { user, usersList, allSantriList, importSantriBatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperadmin = user?.role === 'KASIE_KEPESANTRENAN';
  const getInitialUnit = (): UnitPesantren => {
    if (isSuperadmin) {
      if (defaultUnit === 'SMP' || defaultUnit === 'MA' || defaultUnit === 'SMA') return defaultUnit;
      return 'SMP';
    }
    if (user?.unit === 'SMP' || user?.unit === 'MA' || user?.unit === 'SMA') {
      return user.unit;
    }
    return 'SMP';
  };

  const [selectedImportUnit, setSelectedImportUnit] = useState<UnitPesantren>(getInitialUnit);

  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<SantriImportRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'valid' | 'duplicate' | 'error'>('all');

  // Musyrif map for validation
  const unitMusyrifs = useMemo(() => {
    return usersList.filter(
      (u) => u.role === 'MUSYRIF' && (u.unit === selectedImportUnit || u.unit === 'ALL') && u.is_active
    );
  }, [usersList, selectedImportUnit]);

  // Existing NIS Set for duplicate detection
  const existingNisMap = useMemo(() => {
    const map = new Map<string, Santri>();
    allSantriList.forEach((s) => {
      map.set(s.nis.toLowerCase().trim(), s);
    });
    return map;
  }, [allSantriList]);

  // Counts & Filtered Rows
  const validRows = useMemo(() => parsedRows.filter((r) => r.status === 'valid'), [parsedRows]);
  const duplicateRows = useMemo(() => parsedRows.filter((r) => r.status === 'duplicate'), [parsedRows]);
  const errorRows = useMemo(() => parsedRows.filter((r) => r.status === 'error'), [parsedRows]);

  const displayedRows = useMemo(() => {
    if (activeTabFilter === 'valid') return validRows;
    if (activeTabFilter === 'duplicate') return duplicateRows;
    if (activeTabFilter === 'error') return errorRows;
    return parsedRows;
  }, [parsedRows, validRows, duplicateRows, errorRows, activeTabFilter]);

  if (!isOpen) return null;

  const handleResetModal = () => {
    setFileName('');
    setParsedRows([]);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseExcelFile = (file: File) => {
    setIsProcessingFile(true);
    setErrorMessage(null);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse to 2D Array of unknown values
        const rawRows = utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (!rawRows || rawRows.length <= 1) {
          setErrorMessage('File Excel kosong atau tidak memiliki data santri.');
          setIsProcessingFile(false);
          return;
        }

        // Detect Header Row
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
          const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('nama') || rowStr.includes('nis') || rowStr.includes('kode')) {
            headerRowIndex = i;
            break;
          }
        }

        const dataRows = rawRows.slice(headerRowIndex + 1);
        const result: SantriImportRow[] = [];
        const seenNisInBatch = new Set<string>();

        dataRows.forEach((row, idx) => {
          // Skip empty row or comment row starting with #
          if (!row || row.length === 0) return;
          const firstColStr = String(row[0] || '').trim();
          if (!firstColStr && !row[1]) return;
          if (firstColStr.startsWith('#')) return; // Ignore example comment rows

          const rawNis = String(row[0] || '').trim();
          const rawNama = String(row[1] || '').trim();
          const rawUnit = String(row[2] || '').trim().toUpperCase();
          const rawKelas = String(row[3] || '').trim();
          const rawMusyrif = String(row[4] || '').trim();
          const rawAsramaKamar = String(row[5] || '').trim();
          const rawStatusPembinaan = String(row[6] || '').trim();
          const rawKeterangan = String(row[7] || '').trim();

          const rowNum = headerRowIndex + 2 + idx;

          // Parse Asrama & Kamar
          let parsedAsrama = `Asrama ${selectedImportUnit}`;
          let parsedKamar = '-';
          if (rawAsramaKamar) {
            if (rawAsramaKamar.includes('/')) {
              const parts = rawAsramaKamar.split('/');
              parsedAsrama = parts[0].trim() || parsedAsrama;
              parsedKamar = parts[1].trim() || '-';
            } else {
              parsedAsrama = rawAsramaKamar;
            }
          }

          // Validation Logic
          let rowStatus: 'valid' | 'duplicate' | 'error' = 'valid';
          let rowErrorMsg: string | undefined = undefined;

          // 1. Mandatory Fields Check
          if (!rawNis) {
            rowStatus = 'error';
            rowErrorMsg = 'NIS / Kode Santri wajib diisi';
          } else if (!rawNama) {
            rowStatus = 'error';
            rowErrorMsg = 'Nama Santri wajib diisi';
          } else if (!rawKelas) {
            rowStatus = 'error';
            rowErrorMsg = 'Kelas Santri wajib diisi';
          }

          // 2. Duplicate NIS Check
          const nisLower = rawNis.toLowerCase();
          if (rowStatus === 'valid') {
            if (existingNisMap.has(nisLower)) {
              rowStatus = 'duplicate';
              const existSantri = existingNisMap.get(nisLower);
              rowErrorMsg = `NIS sudah terdaftar atas nama ${existSantri?.nama} (${existSantri?.unit})`;
            } else if (seenNisInBatch.has(nisLower)) {
              rowStatus = 'duplicate';
              rowErrorMsg = `NIS duplikat di dalam file Excel ini`;
            } else {
              seenNisInBatch.add(nisLower);
            }
          }

          // 3. Unit Validation
          const resolvedUnit: UnitPesantren =
            rawUnit === 'SMP' || rawUnit === 'MA' || rawUnit === 'SMA'
              ? (rawUnit as UnitPesantren)
              : selectedImportUnit;

          // If current user is not superadmin, enforce their own unit
          if (!isSuperadmin && resolvedUnit !== user?.unit) {
            rowStatus = 'error';
            rowErrorMsg = `Unit ${resolvedUnit} tidak sesuai hak akses unit Anda (${user?.unit})`;
          }

          // 4. Resolve Musyrif
          let resolvedMusyId: string | undefined;
          let resolvedMusyNama: string | undefined;

          if (rawMusyrif) {
            const cleanM = rawMusyrif.toLowerCase();
            const matchedMusy = unitMusyrifs.find(
              (m) =>
                m.nama.toLowerCase().includes(cleanM) ||
                cleanM.includes(m.nama.toLowerCase().replace(/ust\.|ustadz\.|s\.pd|lc|s\.pd\.i/g, '').trim())
            );
            if (matchedMusy) {
              resolvedMusyId = matchedMusy.id;
              resolvedMusyNama = matchedMusy.nama;
            } else {
              // Non-blocking: just save as name text or assign first unit musyrif
              resolvedMusyNama = rawMusyrif;
            }
          }

          result.push({
            rowNumber: rowNum,
            nis: rawNis,
            nama: rawNama.toUpperCase(),
            unit: resolvedUnit,
            kelas: rawKelas,
            musyrif: rawMusyrif,
            asrama: parsedAsrama,
            kamar: parsedKamar,
            statusPembinaan: rawStatusPembinaan || 'Baik',
            keterangan: rawKeterangan,
            status: rowStatus,
            errorMessage: rowErrorMsg,
            resolvedMusyrifId: resolvedMusyId,
            resolvedMusyrifNama: resolvedMusyNama
          });
        });

        setParsedRows(result);
        setIsProcessingFile(false);
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        setErrorMessage('Gagal memproses file Excel. Pastikan format file adalah .xlsx atau .xls yang valid.');
        setIsProcessingFile(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Terjadi kendala saat membaca file dari komputer Anda.');
      setIsProcessingFile(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      parseExcelFile(file);
    } else if (file) {
      setErrorMessage('Mohon unggah file dengan format .xlsx atau .xls');
    }
  };

  const handleExecuteImport = () => {
    if (validRows.length === 0) {
      setErrorMessage('Tidak ada data valid yang dapat dimasukkan ke database.');
      return;
    }

    const payload = validRows.map((r) => ({
      nis: r.nis,
      nama: r.nama,
      kelas: r.kelas,
      unit: (r.unit as UnitPesantren) || selectedImportUnit,
      musyrifId: r.resolvedMusyrifId,
      musyrifNama: r.resolvedMusyrifNama || r.musyrif,
      asrama: r.asrama,
      kamar: r.kamar,
      statusPembinaan: (r.statusPembinaan as any) || 'Baik',
      keterangan: r.keterangan
    }));

    const res = importSantriBatch(payload);
    if (res.success) {
      handleResetModal();
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#101C2F] border border-slate-200 dark:border-[#1E3048] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1E3048] flex items-center justify-between bg-slate-50 dark:bg-[#081221] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Import Santri dari Excel
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-normal">
                  Unit {selectedImportUnit}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Unggah template data santri untuk menambah data secara massal tanpa mengubah data MA yang ada.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15253F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Unit Target Selector & Template Download Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048]">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Unit Santri:
              </label>
              <div className="flex items-center gap-2">
                {(['SMP', 'MA', 'SMA'] as UnitPesantren[]).map((u) => {
                  const isDisabled = !isSuperadmin && user?.unit !== u;
                  const isSelected = selectedImportUnit === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedImportUnit(u);
                        if (parsedRows.length > 0) {
                          // Re-validate parsed rows with new unit
                          handleResetModal();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-[#15233C] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#1E3050]'
                      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      Unit {u}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex sm:justify-end items-center">
              <button
                type="button"
                onClick={generateSantriExcelTemplate}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-600/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-600/25 text-xs font-medium transition-colors cursor-pointer w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Unduh Format Template Excel</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          {parsedRows.length === 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/60 dark:bg-[#0B1628]/60 hover:bg-slate-100 dark:hover:bg-[#0B1628] group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Pilih File Excel atau Drag & Drop ke Sini
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Mendukung format file <strong>.xlsx</strong> atau <strong>.xls</strong>. Format kolom: Kode/NIS, Nama Santri, Unit, Kelas, Musyrif, Asrama/Kamar.
              </p>
            </div>
          )}

          {/* Error / Alert Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Summary Preview after file parsed */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* File Info & Status Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1628] border border-slate-200 dark:border-[#1E3048]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                    {fileName}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({parsedRows.length} total baris)
                  </span>
                </div>

                <button
                  onClick={handleResetModal}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 underline font-medium self-start sm:self-auto cursor-pointer"
                >
                  Ganti File Excel
                </button>
              </div>

              {/* Status Statistic Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('all')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTabFilter === 'all'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-1 ring-slate-400'
                      : 'bg-slate-50 dark:bg-[#0B1628] border-slate-200 dark:border-[#1E3048] hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Baris</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{parsedRows.length}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabFilter('valid')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTabFilter === 'valid'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-400'
                      : 'bg-slate-50 dark:bg-[#0B1628] border-slate-200 dark:border-[#1E3048] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Data Valid</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{validRows.length}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabFilter('duplicate')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTabFilter === 'duplicate'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500/60 ring-1 ring-amber-400'
                      : 'bg-slate-50 dark:bg-[#0B1628] border-slate-200 dark:border-[#1E3048] hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                  }`}
                >
                  <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Duplikat (Lewati)</span>
                  </div>
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{duplicateRows.length}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabFilter('error')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTabFilter === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500/60 ring-1 ring-rose-400'
                      : 'bg-slate-50 dark:bg-[#0B1628] border-slate-200 dark:border-[#1E3048] hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                  }`}
                >
                  <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Data Error</span>
                  </div>
                  <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">{errorRows.length}</div>
                </button>
              </div>

              {/* Table Data Preview */}
              <div className="border border-slate-200 dark:border-[#1E3048] rounded-xl overflow-hidden bg-white dark:bg-[#0B1628]">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#081221] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-[#1E3048] sticky top-0 font-semibold z-10">
                      <tr>
                        <th className="py-2.5 px-3">Baris</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">NIS</th>
                        <th className="py-2.5 px-3">Nama Santri</th>
                        <th className="py-2.5 px-3">Unit/Kelas</th>
                        <th className="py-2.5 px-3">Musyrif</th>
                        <th className="py-2.5 px-3">Keterangan / Diagnosa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400 dark:text-slate-500">
                            Tidak ada data untuk kategori status ini.
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map((r, i) => (
                          <tr
                            key={i}
                            className={`hover:bg-slate-50 dark:hover:bg-[#121E36]/40 transition-colors ${
                              r.status === 'valid'
                                ? 'bg-emerald-500/5'
                                : r.status === 'duplicate'
                                ? 'bg-amber-500/5'
                                : 'bg-rose-500/5'
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-slate-400">#{r.rowNumber}</td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {r.status === 'valid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              )}
                              {r.status === 'duplicate' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                  <AlertTriangle className="w-3 h-3" /> Duplikat
                                </span>
                              )}
                              {r.status === 'error' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-semibold">
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-200">{r.nis || '-'}</td>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">{r.nama || '-'}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{r.unit}</span> - {r.kelas}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                              {r.resolvedMusyrifNama || r.musyrif || '-'}
                            </td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                              {r.errorMessage ? (
                                <span className={r.status === 'duplicate' ? 'text-amber-600 dark:text-amber-300' : 'text-rose-600 dark:text-rose-300'}>
                                  {r.errorMessage}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">Siap diimport (Insert Baru)</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Advice Note */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Aturan Import SIMKA.ID:</strong> Hanya baris dengan status{' '}
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Valid ({validRows.length} data)</span>{' '}
                  yang akan dimasukkan ke dalam database. Data duplikat dan baris error akan otomatis dilewati tanpa mengganggu proses insert.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#1E3048] bg-slate-50 dark:bg-[#081221] flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedRows.length > 0 && (
              <span>
                Akan menambahkan <strong className="text-emerald-600 dark:text-emerald-400">{validRows.length} santri</strong> ke Unit {selectedImportUnit}.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                handleResetModal();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15253F] transition-colors cursor-pointer"
            >
              Batal
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={validRows.length === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan {validRows.length} Data Santri</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
