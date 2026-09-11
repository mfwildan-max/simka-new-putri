import React from 'react';
import { useApp } from '../../context/AppContext';
import { PointBadge, StatusSantriBadge } from './PointBadge';
import { X, User, GraduationCap, Building, ShieldAlert, Award, FileText, CheckCircle2, Clock } from 'lucide-react';

export const DetailSantriModal: React.FC = () => {
  const { selectedSantriForDetail, setSelectedSantriForDetail, riwayatList, setCurrentRoute } = useApp();

  if (!selectedSantriForDetail) return null;

  const santri = selectedSantriForDetail;
  const santriLogs = riwayatList.filter((r) => r.santriId === santri.id || r.santriNama.toLowerCase() === santri.nama.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0F1A2E] border border-slate-200 dark:border-[#1E2E4A] shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1E2E4A] bg-slate-50 dark:bg-[#121F37]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Rekam Jejak & Detail Santri
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pusat data pembinaan akhlak & karakter santri
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedSantriForDetail(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1E2E4A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Summary */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0B1322] border border-slate-200 dark:border-[#1A2840]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Nama Lengkap</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">{santri.nama}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Kelas {santri.kelas} - {santri.unit}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Musyrif Pembina & Asrama</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{santri.musyrifNama || 'Belum Ditugaskan'}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{santri.asrama || `Asrama ${santri.unit}`} {santri.kamar ? `• ${santri.kamar}` : ''}</span>
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Akumulasi Poin</span>
              <div className="mt-1 flex sm:justify-end items-center gap-2">
                <PointBadge points={santri.totalPoin} size="lg" />
              </div>
              <div className="mt-1 flex sm:justify-end">
                <StatusSantriBadge status={santri.statusPembinaan} />
              </div>
            </div>
          </div>

          {/* Violation History List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Riwayat Pelanggaran ({santriLogs.length})
                </h4>
              </div>
              <button
                onClick={() => {
                  setSelectedSantriForDetail(null);
                  setCurrentRoute('catat-pelanggaran');
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
              >
                + Catat Pelanggaran Baru
              </button>
            </div>

            {santriLogs.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl bg-slate-50 dark:bg-[#0B1322] border border-slate-200 dark:border-[#1A2840]">
                <Award className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-white">Alhamdulillah, Belum Ada Catatan Pelanggaran</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Santri ini memiliki rekam jejak akhlak & kedisiplinan yang sangat baik.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1A2840]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-[#121E33] text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-[#1A2840]">
                    <tr>
                      <th className="py-2.5 px-3">TGL / WAKTU</th>
                      <th className="py-2.5 px-3">JENIS PELANGGARAN</th>
                      <th className="py-2.5 px-3 text-center">POIN</th>
                      <th className="py-2.5 px-3">KONSEKUENSI / HUKUMAN</th>
                      <th className="py-2.5 px-3 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1A2840] text-slate-800 dark:text-slate-200">
                    {santriLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-[#13223A] transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {log.tanggal}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-xs">
                          <div>{log.jenisPelanggaranNama}</div>
                          {log.catatan && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{log.catatan}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <PointBadge points={log.poin} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] max-w-[180px] truncate">
                          {log.hukuman || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'Selesai'
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {log.status === 'Selesai' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{log.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
