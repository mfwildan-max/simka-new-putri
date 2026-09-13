import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RiwayatPelanggaran } from '../types';

export interface ExportPdfOptions {
  unitFilter?: string;
  statusFilter?: string;
  searchQuery?: string;
  userRole?: string;
  userName?: string;
}

/**
 * Format category based on official point ranges:
 * 5–49   -> Sangat Ringan
 * 50–69  -> Ringan
 * 70–89  -> Sedang
 * 90–99  -> Berat
 * 100+   -> Sangat Berat
 */
export function getOfficialKategori(poin: number): {
  label: string;
  textColor: [number, number, number];
  bgColor: [number, number, number];
} {
  if (poin >= 100) {
    return { label: 'Sangat Berat', textColor: [153, 27, 27], bgColor: [254, 226, 226] }; // Red
  }
  if (poin >= 90) {
    return { label: 'Berat', textColor: [154, 52, 18], bgColor: [255, 237, 213] }; // Orange
  }
  if (poin >= 70) {
    return { label: 'Sedang', textColor: [133, 77, 14], bgColor: [254, 249, 195] }; // Amber
  }
  if (poin >= 50) {
    return { label: 'Ringan', textColor: [29, 78, 216], bgColor: [239, 246, 255] }; // Blue
  }
  return { label: 'Sangat Ringan', textColor: [4, 120, 87], bgColor: [236, 253, 245] }; // Emerald
}

/**
 * Export filtered riwayat pelanggaran to high quality, publication-ready A4 PDF
 */
export function exportRiwayatPelanggaranPDF(
  records: RiwayatPelanggaran[],
  options: ExportPdfOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const formattedDate = `${now.getDate()} ${monthsIndo[now.getMonth()]} ${now.getFullYear()}, ${String(
    now.getHours()
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
  const currentPeriod = `${monthsIndo[now.getMonth()]} ${now.getFullYear()}`;

  const unitLabel = options.unitFilter && options.unitFilter !== 'ALL' && options.unitFilter !== 'Semua'
    ? `Unit ${options.unitFilter}`
    : 'Semua Unit (SMP, MA, SMA)';

  const statusLabel = options.statusFilter && options.statusFilter !== 'All' && options.statusFilter !== 'Semua'
    ? options.statusFilter
    : 'Semua Status';

  // Compute summary stats
  const totalRecords = records.length;
  const uniqueSantri = new Set(records.map((r) => r.santriId || r.santriNama)).size;
  const totalPoints = records.reduce((sum, r) => sum + (r.poin || 0), 0);
  const totalSelesai = records.filter((r) => r.status === 'Selesai').length;
  const totalBelumSelesai = records.filter((r) => r.status !== 'Selesai').length;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // 1. PAGE HEADER (Page 1)
  let currentY = 15;

  // Top Bar Accent
  doc.setFillColor(15, 76, 58); // Dark Pesantren Emerald
  doc.rect(marginX, currentY, contentWidth, 2, 'F');
  currentY += 6;

  // Header Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('REKAP RIWAYAT PELANGGARAN SANTRI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text('PESANTREN NURUL ISLAM TENGARAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('SIMKA.ID — Sistem Monitoring Karakter & Akhlak Santri', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  // Horizontal Divider Line
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 5;

  // 2. FILTER & METADATA BAR (2 Columns)
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(marginX, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  // Column 1
  doc.setTextColor(71, 85, 105);
  doc.text('Periode:', marginX + 4, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(currentPeriod, marginX + 22, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Unit:', marginX + 4, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(unitLabel, marginX + 22, currentY + 10);

  // Column 2
  const col2X = marginX + (contentWidth / 2) + 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Status:', col2X, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(statusLabel, col2X + 26, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tanggal Cetak:', col2X, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formattedDate, col2X + 26, currentY + 10);

  currentY += 18;

  // 3. STATISTICAL SUMMARY BOXES (4 Columns)
  const boxWidth = (contentWidth - 9) / 4;
  const boxHeight = 12;

  const statBoxes = [
    { label: 'TOTAL PELANGGARAN', value: `${totalRecords} Data`, color: [15, 76, 58] as [number, number, number] },
    { label: 'SANTRI TERLIBAT', value: `${uniqueSantri} Santri`, color: [2, 132, 199] as [number, number, number] },
    { label: 'TOTAL POIN', value: `${totalPoints} Poin`, color: [225, 29, 72] as [number, number, number] },
    { label: 'STATUS TINDAK LANJUT', value: `${totalSelesai} Selesai • ${totalBelumSelesai} Aktif`, color: [79, 70, 229] as [number, number, number] }
  ];

  statBoxes.forEach((box, i) => {
    const x = marginX + i * (boxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(box.label, x + 3, currentY + 4.2);

    doc.setFontSize(8.5);
    doc.setTextColor(box.color[0], box.color[1], box.color[2]);
    doc.text(box.value, x + 3, currentY + 9.2);
  });

  currentY += 16;

  // Optional: Search filter note
  if (options.searchQuery && options.searchQuery.trim()) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`* Filter kata kunci aktif: "${options.searchQuery}" (${totalRecords} hasil)`, marginX, currentY);
    currentY += 4;
  }

  // 4. TABLE GENERATION USING autoTable (Vector text, clean cell wrap, multi-page headers)
  const tableData = records.map((log, index) => {
    const kat = getOfficialKategori(log.poin);
    return [
      String(index + 1),
      log.tanggal || '-',
      log.santriNama || '-',
      `${log.santriKelas || '-'} (${log.santriUnit || '-'})`,
      log.jenisPelanggaranNama || '-',
      `+${log.poin} Poin`,
      kat.label,
      log.pencatat || 'Petugas',
      log.status || 'Belum Selesai'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Tanggal', 'Nama Santri', 'Kelas / Unit', 'Jenis Pelanggaran', 'Poin', 'Kategori', 'Pelapor', 'Status']],
    body: tableData,
    theme: 'grid',
    margin: { left: marginX, right: marginX, top: 18, bottom: 18 },
    showHead: 'everyPage',
    headStyles: {
      fillColor: [15, 76, 58], // Forest Emerald
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.8,
      lineWidth: 0.2,
      lineColor: [203, 213, 225]
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 41, 59], // Slate 800
      cellPadding: 2.2,
      valign: 'middle',
      lineWidth: 0.15,
      lineColor: [226, 232, 240]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 }, // No
      1: { cellWidth: 23 },                  // Tanggal
      2: { fontStyle: 'bold', cellWidth: 28 },// Nama Santri
      3: { halign: 'center', cellWidth: 16 },// Kelas / Unit
      4: { cellWidth: 'auto' },              // Jenis Pelanggaran (auto wrap, no clipping)
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 13 }, // Poin
      6: { halign: 'center', cellWidth: 18 }, // Kategori
      7: { cellWidth: 20 },                  // Pelapor
      8: { halign: 'center', cellWidth: 16 }  // Status
    },
    didParseCell: (data) => {
      // Styling custom for Poin, Kategori, and Status cells
      if (data.section === 'body') {
        const rawRow = records[data.row.index];
        if (!rawRow) return;

        // Poin Column (Index 5)
        if (data.column.index === 5) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose 600
        }

        // Kategori Column (Index 6)
        if (data.column.index === 6) {
          const kat = getOfficialKategori(rawRow.poin);
          data.cell.styles.textColor = kat.textColor;
          data.cell.styles.fontStyle = 'bold';
        }

        // Status Column (Index 8)
        if (data.column.index === 8) {
          if (rawRow.status === 'Selesai') {
            data.cell.styles.textColor = [4, 120, 87]; // Emerald 700
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [185, 28, 28]; // Red 700
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    didDrawPage: (data) => {
      const pageNumber = data.pageNumber;
      const totalPageCount = (doc.internal as any).getNumberOfPages();

      // Top running title on pages 2+
      if (pageNumber > 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text('Rekap Riwayat Pelanggaran Santri — Pesantren Nurul Islam Tengaran', marginX, 10);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(marginX, 12, pageWidth - marginX, 12);
      }

      // Bottom Running Footer on every page
      const footerY = pageHeight - 10;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(marginX, footerY - 2.5, pageWidth - marginX, footerY - 2.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // Slate 500

      // Left footer
      doc.text('SIMKA.ID — Sistem Monitoring Karakter & Akhlak Santri', marginX, footerY);

      // Center footer
      doc.text(`Dicetak: ${formattedDate}`, pageWidth / 2, footerY, { align: 'center' });

      // Right footer
      doc.text(`Halaman ${pageNumber} dari ${totalPageCount}`, pageWidth - marginX, footerY, { align: 'right' });
    }
  });

  // Save/Download PDF
  const cleanUnitName = (options.unitFilter || 'SEMUA').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStamp = now.toISOString().slice(0, 10);
  doc.save(`Rekap_Pelanggaran_Santri_${cleanUnitName}_${dateStamp}.pdf`);
}
