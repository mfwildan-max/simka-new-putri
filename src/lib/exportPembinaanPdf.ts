import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PembinaanFormData } from './pembinaanHelper';

/**
 * Generate and download pure vector, publication-grade A4 Portrait PDF for MUTABA'AH PEMBINAAN SANTRI
 * Strictly respects text-wrapping (splitTextToSize), dynamic height calculation, and clean signature columns.
 */
export function exportMutabaahPembinaanPDF(data: PembinaanFormData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const { header, santri, pelanggaran, pembinaan, mutabaahRows, officers } = data;
  const codes = pembinaan.itemsWithCode;

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  let currentY = 12;

  // ============================================================
  // 1. KOP SURAT & DOKUMEN RESMI
  // ============================================================
  // Top green decorative bar
  doc.setFillColor(0, 168, 120); // #00A878 Emerald
  doc.rect(marginX, currentY, contentWidth, 1.8, 'F');
  currentY += 5.5;

  // Document Title
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(header.title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Institution Subtitle
  doc.setFontSize(10.5);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text(header.institution.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.8;

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SIMKA.ID — Sistem Monitoring Karakter & Akhlak Santri', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.5;

  // Double horizontal line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  doc.setLineWidth(0.2);
  doc.line(marginX, currentY + 0.8, pageWidth - marginX, currentY + 0.8);
  currentY += 3.5;

  // ============================================================
  // 2. LEVEL & DURASI BAR
  // ============================================================
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, 7, 1, 1, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  doc.text(`LEVEL: ${header.levelName}`, marginX + 3, currentY + 4.5);
  doc.text(`POIN PELANGGARAN: ${header.rangePoin} (${pelanggaran.poin} Poin)`, marginX + (contentWidth * 0.38), currentY + 4.5);
  doc.text(`DURASI: ${header.durasiText}`, pageWidth - marginX - 3, currentY + 4.5, { align: 'right' });

  currentY += 9;

  // ============================================================
  // 3. IDENTITAS SANTRI & DETAIL PELANGGARAN (WRAP TEXT DYNAMIC)
  // ============================================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  
  const colHalf = contentWidth / 2;
  const leftX = marginX + 3;
  const rightX = marginX + colHalf + 3;

  // Calculate wrapped text heights
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);

  const namaLines = doc.splitTextToSize(santri.nama.toUpperCase(), colHalf - 32);
  const jenisPelanggaranLines = doc.splitTextToSize(pelanggaran.jenis, colHalf - 36);
  const musyrifLines = doc.splitTextToSize(officers.musyrifNama, colHalf - 36);
  const kelasInfo = `${santri.kelas} (${santri.unit}) / ${santri.kamar}`;

  const maxLeftLines = 1 + namaLines.length + 1; // kelas + nama + total poin
  const maxRightLines = 1 + jenisPelanggaranLines.length + musyrifLines.length;
  const maxLineCount = Math.max(maxLeftLines, maxRightLines, 3);
  const idBoxHeight = Math.max(18, maxLineCount * 4.2 + 6);

  doc.roundedRect(marginX, currentY, contentWidth, idBoxHeight, 1, 1, 'FD');

  let idY = currentY + 4;

  // Left Column: Nama, Kelas/Kamar, Total Poin
  doc.setFont('times', 'bold');
  doc.text('Nama Santri', leftX, idY);
  doc.text(':', leftX + 22, idY);
  doc.text(namaLines, leftX + 25, idY);

  const namaHeightOffset = namaLines.length * 4;
  
  doc.text('Kelas / Kamar', leftX, idY + namaHeightOffset);
  doc.text(':', leftX + 22, idY + namaHeightOffset);
  doc.setFont('times', 'normal');
  doc.text(kelasInfo, leftX + 25, idY + namaHeightOffset);

  doc.setFont('times', 'bold');
  doc.text('Total Poin', leftX, idY + namaHeightOffset + 4.5);
  doc.text(':', leftX + 22, idY + namaHeightOffset + 4.5);
  doc.setTextColor(185, 28, 28); // Red
  doc.text(`${santri.totalPoin} Poin`, leftX + 25, idY + namaHeightOffset + 4.5);
  doc.setTextColor(15, 23, 42);

  // Right Column: Jenis Pelanggaran (Auto-wrapped), Periode, Musyrif
  doc.setFont('times', 'bold');
  doc.text('Jenis Pelanggaran', rightX, idY);
  doc.text(':', rightX + 26, idY);
  doc.setFont('times', 'normal');
  doc.text(jenisPelanggaranLines, rightX + 29, idY);

  const jenisHeightOffset = jenisPelanggaranLines.length * 4;

  doc.setFont('times', 'bold');
  doc.text('Periode Pembinaan', rightX, idY + jenisHeightOffset);
  doc.text(':', rightX + 26, idY + jenisHeightOffset);
  doc.setFont('times', 'normal');
  doc.text(pembinaan.periodeText, rightX + 29, idY + jenisHeightOffset);

  doc.setFont('times', 'bold');
  doc.text('Musyrif / Musyrifah', rightX, idY + jenisHeightOffset + 4.5);
  doc.text(':', rightX + 26, idY + jenisHeightOffset + 4.5);
  doc.setFont('times', 'normal');
  doc.text(musyrifLines, rightX + 29, idY + jenisHeightOffset + 4.5);

  currentY += idBoxHeight + 2;

  // Hint text
  doc.setFont('times', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('* Tanda (✓) = kegiatan pembinaan telah dilaksanakan. Kolom \'Paraf\' wajib divalidasi oleh Musyrif/ah pendamping.', marginX, currentY);
  currentY += 3;

  // ============================================================
  // 4. TABEL KETERANGAN KOLOM JENIS PEMBINAAN (P1 - Pn)
  // ============================================================
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    head: [['Kode', 'Uraian Butir Jenis Pembinaan']],
    body: codes.map((c) => [c.code, c.uraian]),
    styles: {
      font: 'times',
      fontSize: 7.5,
      cellPadding: 1.2,
      textColor: [15, 23, 42],
      lineColor: [30, 41, 59],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', halign: 'left' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // ============================================================
  // 5. TABEL MUTABA'AH HARIAN (Dinamis Sesuai Durasi Hari)
  // ============================================================
  const codeHeaders = codes.map((c) => c.code);
  const emptyHeadersCount = Math.max(0, 11 - codes.length);
  const extraHeaders = Array.from({ length: emptyHeadersCount }, () => '-');

  const tableHead = [
    ['No', 'Tanggal', ...codeHeaders, ...extraHeaders, 'Paraf', 'Keterangan']
  ];

  const tableBody = mutabaahRows.map((row) => [
    row.no,
    '..../..../20....',
    ...codes.map(() => ''),
    ...extraHeaders.map(() => ''),
    '',
    ''
  ]);

  // Append Summary Row
  tableBody.push([
    'Jumlah Hari Terlaksana:',
    '',
    `.......... Hari (Target: ${header.durasiHari} Hari)`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);

  const colStyles: any = {
    0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
    1: { cellWidth: 22, halign: 'center', fontSize: 6.5, font: 'courier' }
  };

  // Assign width to P1-P11 columns
  for (let i = 0; i < 11; i++) {
    colStyles[2 + i] = { cellWidth: 6, halign: 'center' };
  }
  colStyles[13] = { cellWidth: 14, halign: 'center' };
  colStyles[14] = { cellWidth: 'auto', halign: 'left' };

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    head: tableHead,
    body: tableBody,
    styles: {
      font: 'times',
      fontSize: 7,
      cellPadding: 1,
      textColor: [15, 23, 42],
      lineColor: [30, 41, 59],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center'
    },
    columnStyles: colStyles,
    didParseCell: (dataCell) => {
      // Summary footer styling
      if (dataCell.row.index === tableBody.length - 1) {
        dataCell.cell.styles.fillColor = [241, 245, 249];
        dataCell.cell.styles.fontStyle = 'bold';
        if (dataCell.column.index === 0) {
          dataCell.cell.colSpan = 2;
          dataCell.cell.styles.halign = 'right';
        } else if (dataCell.column.index === 2) {
          dataCell.cell.colSpan = 13;
          dataCell.cell.styles.halign = 'center';
        }
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // ============================================================
  // 6. AREA TANDA TANGAN 4 KOLOM DENGAN JARAK LEGA & AUTO-WRAP
  // ============================================================
  // Ensure we don't bleed out of page; if Y is too close to bottom, adjust safely
  if (currentY > pageHeight - 38) {
    currentY = pageHeight - 38;
  }

  // Date and place
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(officers.kotaTanggal, pageWidth - marginX, currentY, { align: 'right' });
  currentY += 4;

  const sigColWidth = contentWidth / 4;
  const colCenters = [
    marginX + sigColWidth * 0.5,
    marginX + sigColWidth * 1.5,
    marginX + sigColWidth * 2.5,
    marginX + sigColWidth * 3.5
  ];

  // Titles
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text('Santri', colCenters[0], currentY, { align: 'center' });
  doc.text('Orang Tua / Wali', colCenters[1], currentY, { align: 'center' });
  doc.text('Musyrif / Musyrifah', colCenters[2], currentY, { align: 'center' });
  
  doc.setFontSize(7.5);
  doc.text('Mengetahui,', colCenters[3], currentY - 1.5, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Koordinator Unit ${officers.unitName}`, colCenters[3], currentY + 1.8, { align: 'center' });

  // Signature gap
  currentY += 15;

  // Names (Wrapped cleanly up to 2 lines, centered)
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);

  const santriSigName = doc.splitTextToSize(santri.nama.toUpperCase(), sigColWidth - 4);
  const musyrifSigName = doc.splitTextToSize(officers.musyrifNama, sigColWidth - 4);
  const koordinatorSigName = doc.splitTextToSize(officers.koordinatorNama, sigColWidth - 4);

  doc.text(santriSigName, colCenters[0], currentY, { align: 'center' });
  doc.text('Orang Tua / Wali Santri', colCenters[1], currentY, { align: 'center' });
  doc.text(musyrifSigName, colCenters[2], currentY, { align: 'center' });
  doc.text(koordinatorSigName, colCenters[3], currentY, { align: 'center' });

  currentY += Math.max(santriSigName.length, musyrifSigName.length, koordinatorSigName.length) * 3.5;

  // Subtitles / (Nama & Paraf)
  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('(Nama & Paraf)', colCenters[0], currentY, { align: 'center' });
  doc.text('(Nama & Paraf)', colCenters[1], currentY, { align: 'center' });
  doc.text('(Nama & Paraf)', colCenters[2], currentY, { align: 'center' });
  doc.text('(Nama & Paraf)', colCenters[3], currentY, { align: 'center' });

  // Trigger download
  const sanitizedName = santri.nama.replace(/[\\/:*?"<>|]/g, '').trim() || 'Santri';
  const fileName = `Form Mutabaah Pembinaan - ${sanitizedName} - Tingkat ${header.levelNumber}.pdf`;
  doc.save(fileName);
}
