import React, { useState } from 'react';
import { PembinaanFormData } from '../../lib/pembinaanHelper';
import { Printer, X, Download, FileCheck, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface FormPembinaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PembinaanFormData | null;
}

export const FormPembinaanModal: React.FC<FormPembinaanModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [lastBlobUrl, setLastBlobUrl] = useState<{ url: string; fileName: string } | null>(null);

  if (!isOpen || !data) return null;

  const { header, santri, pelanggaran, pembinaan, mutabaahRows, officers } = data;
  const codes = pembinaan.itemsWithCode;

  // Ukuran baris & padding dinamis yang dihitung presisi untuk memanfaatkan ruang A4 secara seimbang
  // dan menghilangkan rongga kosong berlebih di bagian bawah tanpa membuat form terlalu padat:
  const totalDays = mutabaahRows.length;
  
  // Row height dinamis agar tabel mengisi ruang vertikal secara elegan
  const rowHeightStyle =
    totalDays <= 3 ? 'h-9' :
    totalDays <= 5 ? 'h-8' :
    totalDays <= 7 ? 'h-7' :
    totalDays <= 10 ? 'h-6' :
    totalDays <= 12 ? 'h-[23px]' : 'h-[21px]';

  const cellPaddingClass =
    totalDays <= 7 ? 'py-1' :
    totalDays <= 10 ? 'py-0.5' : 'py-0';

  // Sizing dinamis untuk section atas & keterangan P1-P11
  const isHighDayCount = totalDays >= 12;
  const sectionGapClass = isHighDayCount ? 'mb-2' : 'mb-3';
  const headerPaddingClass = isHighDayCount ? 'pb-1.5 mb-2' : 'pb-2 mb-2.5';
  const identitasPaddingClass = isHighDayCount ? 'p-2 mb-2 text-[11px]' : 'p-2.5 mb-3 text-[11.5px]';
  const uraianFontSizeClass = isHighDayCount ? 'text-[9.5px]' : 'text-[10px]';
  const tableHeaderPaddingClass = isHighDayCount ? 'py-1' : 'py-1.5';
  
  // Area tanda tangan diperlebar dengan ruang kosong yang lega (h-28 hingga h-32)
  const signatureBoxHeightClass = isHighDayCount ? 'h-24' : 'h-28';
  const signatureGapHeightClass = isHighDayCount ? 'h-12' : 'h-14';

  const handlePrint = () => {
    window.print();
  };

  const triggerBrowserDownload = (blob: Blob, fileName: string) => {
    const objectUrl = URL.createObjectURL(blob);
    console.log('[PDF] Blob created with size:', blob.size, 'bytes. URL:', objectUrl);

    setLastBlobUrl({ url: objectUrl, fileName });

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.setAttribute('target', '_self');
    link.style.display = 'none';

    document.body.appendChild(link);
    console.log('[PDF] Download triggered via temporary link element for file:', fileName);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 200);

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 120000);
  };

  const handleDownloadPDF = async () => {
    console.log('[PDF] Starting generation...');
    const pageElement = document.getElementById('printable-form-pembinaan-page-1');
    if (!pageElement) {
      console.error('[PDF] Error: Printable element not found!');
      alert('Elemen dokumen form pembinaan tidak ditemukan.');
      return;
    }

    setIsGenerating(true);
    setDownloadSuccessMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      console.log('[PDF] Generating HD canvas with html2canvas-pro...');
      // Menggunakan scale 2.5 untuk teks tajam HD anti blur
      const canvas = await html2canvas(pageElement, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 794
      });

      console.log('[PDF] HD Canvas generated:', canvas.width, 'x', canvas.height);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Hitung scaling satu faktor proporsional agar rasio A4 terkunci sempurna (TIDAK PENYET / TIDAK DISTORSI)
      const canvasAspectRatio = canvas.width / canvas.height;
      const pdfAspectRatio = pdfWidth / pdfHeight;

      let renderWidth = pdfWidth;
      let renderHeight = pdfHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasAspectRatio > pdfAspectRatio) {
        renderWidth = pdfWidth;
        renderHeight = pdfWidth / canvasAspectRatio;
        offsetY = (pdfHeight - renderHeight) / 2;
      } else {
        renderHeight = pdfHeight;
        renderWidth = pdfHeight * canvasAspectRatio;
        offsetX = (pdfWidth - renderWidth) / 2;
      }

      console.log('[PDF] Proportional fit mapping calculated:', { renderWidth, renderHeight, offsetX, offsetY });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');

      const sanitizedName = santri.nama.replace(/[\\/:*?"<>|]/g, '').trim() || 'Santri';
      const fileName = `Form Pembinaan - ${sanitizedName} - Tingkat ${header.levelNumber}.pdf`;

      const pdfBlobOutput = pdf.output('blob');
      const pdfBlob = new Blob([pdfBlobOutput], { type: 'application/pdf' });

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Blob PDF kosong atau gagal dibuat');
      }

      console.log(`[PDF] Blob generated: ${pdfBlob.size} bytes`);
      triggerBrowserDownload(pdfBlob, fileName);
      console.log('[PDF] Download process completed successfully.');
      setDownloadSuccessMessage(`File "${fileName}" telah diunduh.`);
    } catch (err) {
      console.error('[PDF] Download failed:', err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      {/* Container Dialog */}
      <div className="relative w-full max-w-5xl my-4 bg-[#0B1322] border border-[#1E304F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (Screen only) */}
        <div className="no-print flex items-center justify-between px-5 py-3 bg-[#0F1B2E] border-b border-[#1E304F] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Preview Form Pembinaan Santri (A4 Siap Cetak)
              </h3>
              <p className="text-[11px] text-slate-400">
                {header.levelName} • {santri.nama} ({santri.kelas} - {santri.unit}) • [1 Halaman Resmi]
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Cetak Langsung via Browser Print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Cetak / Download PDF (A4)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success / Fallback Banner if needed (no-print) */}
        {downloadSuccessMessage && (
          <div className="no-print px-5 py-2 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{downloadSuccessMessage} File otomatis tersimpan di folder Downloads Anda.</span>
            </div>
            {lastBlobUrl && (
              <a
                href={lastBlobUrl.url}
                download={lastBlobUrl.fileName}
                className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400 transition-colors shrink-0"
              >
                Unduh Ulang File
              </a>
            )}
          </div>
        )}

        {/* Modal Body: Scrollable Paper Preview */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-[#070D18] flex flex-col items-center">
          {/* HALAMAN UTAMA A4 RESMI (210mm x 297mm ratio, 794px x 1123px) */}
          <div
            id="printable-form-pembinaan-page-1"
            className="form-pembinaan-a4-page w-full max-w-[794px] min-h-[1123px] bg-white text-slate-900 px-8 py-7 font-serif shadow-2xl rounded-sm flex flex-col justify-between box-border print:m-0 print:p-0 print:shadow-none print:max-w-none print:w-full print:rounded-none print:min-h-0"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              lineHeight: 1.25,
              backgroundColor: '#FFFFFF'
            }}
          >
            {/* BAGIAN ATAS S/D TABEL MUTABA'AH */}
            <div>
              {/* 1. KOP HEADER RESMI */}
              <div className={`text-center ${headerPaddingClass} border-b-2 border-slate-900`}>
                <h1 className="text-[19px] font-bold tracking-wider uppercase text-slate-900 leading-tight">
                  {header.title}
                </h1>
                <h2 className="text-[13.5px] font-bold tracking-wide uppercase text-slate-800">
                  {header.institution}
                </h2>
              </div>

              {/* 2. SUB-BAR LEVEL & DURASI */}
              <div className={`flex flex-wrap items-center justify-between border-y border-slate-900 py-1.5 px-3 bg-slate-100/90 text-[11px] font-bold uppercase ${sectionGapClass} gap-1`}>
                <div>
                  <span>LEVEL: </span>
                  <span className="font-extrabold underline">{header.levelName}</span>
                </div>
                <div>
                  <span>Poin Pelanggaran: </span>
                  <span className="font-extrabold">{header.rangePoin}</span>
                  <span className="text-[10px] font-normal normal-case ml-1">
                    ({pelanggaran.poin} Poin Tunggal)
                  </span>
                </div>
                <div>
                  <span>Durasi: </span>
                  <span className="font-extrabold">{header.durasiText}</span>
                </div>
              </div>

              {/* 3. IDENTITAS SANTRI */}
              <div className={`grid grid-cols-2 gap-x-5 gap-y-1 ${identitasPaddingClass} border border-slate-300 rounded bg-slate-50/50`}>
                <div className="flex">
                  <span className="w-32 font-bold shrink-0">Nama Santri</span>
                  <span className="mr-1">:</span>
                  <span className="font-bold uppercase truncate">{santri.nama}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold shrink-0">Jenis Pelanggaran</span>
                  <span className="mr-1">:</span>
                  <span className="truncate">{pelanggaran.jenis}</span>
                </div>

                <div className="flex">
                  <span className="w-32 font-bold shrink-0">Kelas / Kamar</span>
                  <span className="mr-1">:</span>
                  <span className="truncate">
                    {santri.kelas} ({santri.unit}) / {santri.kamar}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold shrink-0">Periode Pembinaan</span>
                  <span className="mr-1">:</span>
                  <span>{pembinaan.periodeText}</span>
                </div>

                <div className="flex">
                  <span className="w-32 font-bold shrink-0">Total Poin</span>
                  <span className="mr-1">:</span>
                  <span className="font-bold">{santri.totalPoin} Poin</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold shrink-0">Musyrif / Musyrifah</span>
                  <span className="mr-1">:</span>
                  <span className="truncate">{officers.musyrifNama}</span>
                </div>
              </div>

              <p className="text-[9.5px] italic text-slate-700 mb-2">
                * Tanda (✓) = kegiatan pembinaan telah dilaksanakan. Kolom 'Paraf' wajib divalidasi oleh Musyrif/ah pendamping.
              </p>

              {/* 4. TABEL KETERANGAN KOLOM JENIS PEMBINAAN */}
              <div className={sectionGapClass}>
                <div className="bg-slate-800 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  KETERANGAN KOLOM JENIS PEMBINAAN
                </div>
                <table className={`w-full text-left ${uraianFontSizeClass} border-collapse border border-slate-900`}>
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                      <th className="border border-slate-900 px-2 py-0.5 text-center w-10">Kode</th>
                      <th className="border border-slate-900 px-2 py-0.5">Uraian Butir Jenis Pembinaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="border border-slate-900 px-2 py-0.5 text-center font-bold">
                          {item.code}
                        </td>
                        <td className="border border-slate-900 px-2 py-0.5 leading-tight">
                          {item.uraian}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5. TABEL MUTABA'AH HARIAN (Dinamis Sesuai Durasi Hari) */}
              <div className={sectionGapClass}>
                <div className="bg-slate-800 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  TABEL MUTABA'AH HARIAN
                </div>
                <table className="w-full text-center text-[10px] border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                      <th className={`border border-slate-900 px-1 ${tableHeaderPaddingClass} w-7`}>No</th>
                      <th className={`border border-slate-900 px-1.5 ${tableHeaderPaddingClass} w-22`}>Tanggal</th>
                      {codes.map((c) => (
                        <th key={c.code} className={`border border-slate-900 px-0.5 ${tableHeaderPaddingClass} w-6 font-bold`}>
                          {c.code}
                        </th>
                      ))}
                      {codes.length < 11 &&
                        Array.from({ length: 11 - codes.length }).map((_, i) => (
                          <th key={`empty-th-${i}`} className={`border border-slate-900 px-0.5 ${tableHeaderPaddingClass} w-6 text-slate-300`}>
                            -
                          </th>
                        ))}
                      <th className={`border border-slate-900 px-1 ${tableHeaderPaddingClass} w-14`}>Paraf</th>
                      <th className={`border border-slate-900 px-1.5 ${tableHeaderPaddingClass} w-26`}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutabaahRows.map((row) => (
                      <tr key={row.no} className={rowHeightStyle}>
                        <td className={`border border-slate-900 px-1 ${cellPaddingClass} font-bold text-[9.5px]`}>
                          {row.no}
                        </td>
                        <td className={`border border-slate-900 px-1 ${cellPaddingClass} text-[9px] text-slate-400 font-mono`}>
                          ..../..../20....
                        </td>
                        {codes.map((c) => (
                          <td key={c.code} className={`border border-slate-900 px-0.5 ${cellPaddingClass} text-center`}>
                            &nbsp;
                          </td>
                        ))}
                        {codes.length < 11 &&
                          Array.from({ length: 11 - codes.length }).map((_, i) => (
                            <td key={`empty-td-${i}`} className={`border border-slate-900 px-0.5 ${cellPaddingClass} bg-slate-50`}>
                              &nbsp;
                            </td>
                          ))}
                        <td className={`border border-slate-900 px-1 ${cellPaddingClass}`}>
                          &nbsp;
                        </td>
                        <td className={`border border-slate-900 px-1 ${cellPaddingClass} text-left text-[9px]`}>
                          &nbsp;
                        </td>
                      </tr>
                    ))}
                    {/* Baris Ringkasan & Target */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-[10px]">
                      <td colSpan={2} className="border border-slate-900 px-2 py-1 text-right">
                        Jumlah Hari Terlaksana:
                      </td>
                      <td colSpan={codes.length + (codes.length < 11 ? 11 - codes.length : 0)} className="border border-slate-900 px-2 py-1 text-center font-bold">
                        .......... Hari
                      </td>
                      <td colSpan={2} className="border border-slate-900 px-2 py-1 text-center">
                        Target: <span className="underline">{header.durasiHari} Hari</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* BAGIAN BAWAH: TANDA TANGAN 4 KOLOM DENGAN RUANG LEGA UNTUK TTD/PARAF MANUAL */}
            <div className="pt-2 mt-auto">
              <div className="text-right text-[11px] mb-2 font-medium">
                {officers.kotaTanggal}
              </div>

              <div className="grid grid-cols-4 gap-3 text-center text-[10.5px]">
                {/* 1. Santri */}
                <div className={`flex flex-col justify-between ${signatureBoxHeightClass}`}>
                  <p className="font-bold">Santri</p>
                  <div className={signatureGapHeightClass} />
                  <div>
                    <p className="font-bold uppercase text-[11px] truncate">
                      {santri.nama}
                    </p>
                    <p className="text-[9.5px] text-slate-600 mt-0.5">(Nama & Paraf)</p>
                  </div>
                </div>

                {/* 2. Orang Tua / Wali */}
                <div className={`flex flex-col justify-between ${signatureBoxHeightClass}`}>
                  <p className="font-bold">Orang Tua / Wali</p>
                  <div className={signatureGapHeightClass} />
                  <div>
                    <p className="font-bold text-[11px] text-slate-800">
                      Orang Tua / Wali Santri
                    </p>
                    <p className="text-[9.5px] text-slate-600 mt-0.5">(Nama & Paraf)</p>
                  </div>
                </div>

                {/* 3. Musyrif / Musyrifah */}
                <div className={`flex flex-col justify-between ${signatureBoxHeightClass}`}>
                  <p className="font-bold">Musyrif / Musyrifah</p>
                  <div className={signatureGapHeightClass} />
                  <div>
                    <p className="font-bold text-[11px] truncate text-slate-900">
                      {officers.musyrifNama}
                    </p>
                    <p className="text-[9.5px] text-slate-600 mt-0.5">(Nama & Paraf)</p>
                  </div>
                </div>

                {/* 4. Koordinator Unit */}
                <div className={`flex flex-col justify-between ${signatureBoxHeightClass}`}>
                  <div>
                    <p className="text-[9.5px] font-bold">Mengetahui,</p>
                    <p className="font-bold leading-tight text-[10px]">Koordinator Unit {officers.unitName}</p>
                  </div>
                  <div className={signatureGapHeightClass} />
                  <div>
                    <p className="font-bold text-[11px] truncate text-slate-900">
                      {officers.koordinatorNama}
                    </p>
                    <p className="text-[9.5px] text-slate-600 mt-0.5">(Nama & Paraf)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
