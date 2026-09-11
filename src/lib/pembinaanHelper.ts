import { MasterPembinaan, Santri, Pelanggaran, UserAccount } from '../types';

export interface CategorizedPembinaan {
  administrasi: string[];
  spiritual: string[];
  fisik: string[];
  akademik: string[];
}

export interface LevelDuration {
  targetHari: number;
  toleransiHari: number;
  totalHari: number;
  keterangan: string;
}

export interface SeverityCategory {
  levelKey: 'sangat_berat' | 'berat' | 'sedang' | 'ringan' | 'sangat_ringan' | 'unknown';
  label: string;
  poinRange: string;
  colorHex: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  description: string;
}

/**
 * Mengelompokkan butir jenis_pembinaan resmi dari master_pembinaan ke 4 kategori UI:
 * 1. TINDAKAN ADMINISTRASI & ALUR
 * 2. PEMBINAAN SPIRITUAL
 * 3. TINDAKAN FISIK / SOSIAL MENDIDIK
 * 4. PENUGASAN AKADEMIK / NASIHAT
 */
export function categorizePembinaan(items: string[] = []): CategorizedPembinaan {
  const result: CategorizedPembinaan = {
    administrasi: [],
    spiritual: [],
    fisik: [],
    akademik: []
  };

  if (!items || items.length === 0) {
    return result;
  }

  items.forEach((rawItem) => {
    const item = rawItem.trim();
    const lower = item.toLowerCase();

    // 1. PEMBINAAN SPIRITUAL
    // Kata kunci: istighfar, qiyamullail, sholat, tahajud, dzikir, tilawah, ma'tsurat, tadarus, puasa
    if (
      lower.includes('istighfar') ||
      lower.includes('qiyamullail') ||
      lower.includes('tahajud') ||
      lower.includes('dzikir') ||
      lower.includes('tilawah') ||
      lower.includes('al-ma\'tsurat') ||
      lower.includes('matsurat') ||
      lower.includes('tadarus') ||
      lower.includes('puasa') ||
      lower.includes('sholat berjamaah')
    ) {
      result.spiritual.push(item);
    }
    // 2. TINDAKAN FISIK / SOSIAL MENDIDIK
    // Kata kunci: kamar mandi, menyikat, membersihkan, menyapu, mengepel, menyiram, tanaman, sampah, aula
    else if (
      lower.includes('kamar mandi') ||
      lower.includes('menyikat') ||
      lower.includes('membersihkan') ||
      lower.includes('menyapu') ||
      lower.includes('mengepel') ||
      lower.includes('menyiram') ||
      lower.includes('tanaman') ||
      lower.includes('sampah') ||
      lower.includes('aula') ||
      lower.includes('push up') ||
      lower.includes('sit up') ||
      lower.includes('lari') ||
      lower.includes('lingkungan')
    ) {
      result.fisik.push(item);
    }
    // 3. PENUGASAN AKADEMIK / NASIHAT
    // Kata kunci: absen rutin, meminta nasihat, nasihat dan tanda tangan, menulis ulang, menghafal, mufradat, penugasan, resume
    else if (
      lower.includes('absen rutin') ||
      lower.includes('meminta nasihat') ||
      lower.includes('nasihat dan tanda tangan') ||
      lower.includes('menulis ulang') ||
      lower.includes('menghafal') ||
      lower.includes('mufradat') ||
      lower.includes('penugasan') ||
      lower.includes('resume') ||
      lower.includes('ayat/hadits') ||
      lower.includes('hadits') ||
      lower.includes('makalah')
    ) {
      result.akademik.push(item);
    }
    // 4. TINDAKAN ADMINISTRASI & ALUR
    // Kata kunci: surat peringatan, surat pernyataan, pemanggilan, skorsing, digundul, gundul, pakaian khusus, atribut, keluar area pondok, izin, dll
    else {
      result.administrasi.push(item);
    }
  });

  return result;
}

/**
 * Durasi dan target waktu pembinaan resmi berdasarkan Tingkat (1-8)
 */
export function getLevelDuration(tingkat: number): LevelDuration {
  switch (tingkat) {
    case 1:
      return {
        targetHari: 14,
        toleransiHari: 2,
        totalHari: 16,
        keterangan: '14 hari (+ toleransi 2 hari)'
      };
    case 2:
      return {
        targetHari: 12,
        toleransiHari: 2,
        totalHari: 14,
        keterangan: '12 hari (+ toleransi 2 hari)'
      };
    case 3:
      return {
        targetHari: 7,
        toleransiHari: 2,
        totalHari: 9,
        keterangan: '7 hari (+ toleransi 2 hari)'
      };
    case 4:
      return {
        targetHari: 5,
        toleransiHari: 2,
        totalHari: 7,
        keterangan: '5 hari (+ toleransi 2 hari)'
      };
    case 5:
      return {
        targetHari: 4,
        toleransiHari: 2,
        totalHari: 6,
        keterangan: '4 hari (+ toleransi 2 hari)'
      };
    case 6:
      return {
        targetHari: 3,
        toleransiHari: 2,
        totalHari: 5,
        keterangan: '3 hari (+ toleransi 2 hari)'
      };
    case 7:
      return {
        targetHari: 2,
        toleransiHari: 1,
        totalHari: 3,
        keterangan: '2 hari (+ toleransi 1 hari)'
      };
    case 8:
      return {
        targetHari: 1,
        toleransiHari: 1,
        totalHari: 2,
        keterangan: '1 hari (+ toleransi 1 hari)'
      };
    default:
      return {
        targetHari: 7,
        toleransiHari: 2,
        totalHari: 9,
        keterangan: '7 hari (+ toleransi 2 hari)'
      };
  }
}

/**
 * Visual kategori poin pelanggaran (Sangat Berat, Berat, Sedang, Ringan, Sangat Ringan)
 */
export function getSeverityCategory(poin: number): SeverityCategory {
  if (poin >= 100) {
    return {
      levelKey: 'sangat_berat',
      label: 'Sangat Berat',
      poinRange: 'Poin 100',
      colorHex: '#EF4444',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      borderClass: 'border-rose-500/50',
      bgClass: 'bg-rose-500/10',
      textClass: 'text-rose-400',
      description: 'Dikembalikan ke orang tua / Dikeluarkan'
    };
  }
  if (poin >= 90) {
    return {
      levelKey: 'berat',
      label: 'Berat',
      poinRange: 'Poin 90–99',
      colorHex: '#F97316',
      badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      borderClass: 'border-orange-500/50',
      bgClass: 'bg-orange-500/10',
      textClass: 'text-orange-400',
      description: 'Pembinaan Khusus & SP 3'
    };
  }
  if (poin >= 70) {
    return {
      levelKey: 'sedang',
      label: 'Sedang',
      poinRange: 'Poin 70–89',
      colorHex: '#F59E0B',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      borderClass: 'border-amber-500/50',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-300',
      description: 'Pembinaan Intensif & SP 2'
    };
  }
  if (poin >= 50) {
    return {
      levelKey: 'ringan',
      label: 'Ringan',
      poinRange: 'Poin 50–69',
      colorHex: '#3B82F6',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      borderClass: 'border-blue-500/50',
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-300',
      description: 'Pembinaan Terpimpin & SP 1'
    };
  }
  if (poin >= 5) {
    return {
      levelKey: 'sangat_ringan',
      label: 'Sangat Ringan',
      poinRange: 'Poin 5–49',
      colorHex: '#10B981',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      borderClass: 'border-emerald-500/50',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-300',
      description: 'Teguran Lisan & Pembiasaan Akhlak'
    };
  }

  return {
    levelKey: 'unknown',
    label: 'Di Luar Ketentuan',
    poinRange: '< 5 Poin',
    colorHex: '#94A3B8',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    borderClass: 'border-slate-500/50',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    description: 'Belum ada ketentuan pembinaan'
  };
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatDateIndonesian(date: Date, short = false): string {
  const d = date.getDate();
  const m = short ? INDONESIAN_MONTHS_SHORT[date.getMonth()] : INDONESIAN_MONTHS[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

/**
 * Menghitung tanggal target dan toleransi
 */
export function calculatePembinaanDates(targetHari: number, toleransiHari = 2, baseDate = new Date()) {
  const startDate = new Date(baseDate);
  const targetEndDate = new Date(baseDate);
  targetEndDate.setDate(startDate.getDate() + (targetHari > 0 ? targetHari - 1 : 0));

  const graceEndDate = new Date(targetEndDate);
  graceEndDate.setDate(targetEndDate.getDate() + toleransiHari);

  return {
    startDate,
    targetEndDate,
    graceEndDate,
    formattedStartDate: formatDateIndonesian(startDate),
    formattedTargetEndDate: formatDateIndonesian(targetEndDate),
    formattedGraceEndDate: formatDateIndonesian(graceEndDate),
    periodeText: `${formatDateIndonesian(startDate)} s.d. ${formatDateIndonesian(targetEndDate)}`
  };
}

export interface PembinaanFormData {
  header: {
    title: string;
    institution: string;
    levelName: string;
    levelNumber: number;
    poinPelanggaran: number;
    rangePoin: string;
    durasiHari: number;
    toleransiHari: number;
    durasiText: string;
  };
  santri: {
    nama: string;
    nis: string;
    kelas: string;
    kamar: string;
    asrama: string;
    unit: string;
    totalPoin: number;
  };
  pelanggaran: {
    kode: string;
    jenis: string;
    poin: number;
    konsekuensi: string;
  };
  pembinaan: {
    periodeText: string;
    tanggalMulai: string;
    tanggalTargetSelesai: string;
    tanggalToleransiSelesai: string;
    itemsWithCode: { code: string; uraian: string }[];
  };
  mutabaahRows: {
    no: number;
    hariLabel: string;
  }[];
  officers: {
    musyrifNama: string;
    koordinatorNama: string;
    unitName: string;
    kotaTanggal: string;
  };
}

/**
 * Generator data form pembinaan resmi DINAMIS untuk Level 1 s.d 8
 */
export function generatePembinaanFormData(params: {
  santri: Santri;
  pelanggaran: Pelanggaran;
  pembinaan: MasterPembinaan;
  user: UserAccount | null;
  usersList?: UserAccount[];
  startDate?: Date;
}): PembinaanFormData {
  const { santri, pelanggaran, pembinaan, user, usersList = [], startDate = new Date() } = params;
  const duration = getLevelDuration(pembinaan.tingkat);
  const dates = calculatePembinaanDates(duration.targetHari, duration.toleransiHari, startDate);

  // Buat kode P1, P2, P3, ... P11 untuk setiap jenis pembinaan
  const itemsWithCode = pembinaan.jenis_pembinaan.map((uraian, idx) => ({
    code: `P${idx + 1}`,
    uraian
  }));

  // Buat baris mutaba'ah sesuai durasi hari
  const mutabaahRows = Array.from({ length: duration.targetHari }, (_, i) => ({
    no: i + 1,
    hariLabel: `Hari ke-${i + 1}`
  }));

  // Cari nama Koordinator Unit dan Musyrif
  const koordinator = usersList.find(
    (u) => u.role === 'KOORDINATOR' && (u.unit === santri.unit || u.unit === 'ALL')
  ) || usersList.find((u) => u.role === 'KASIE_KEPESANTRENAN');

  const musyrifName = santri.musyrifNama || (user?.role === 'MUSYRIF' ? user.nama : 'Musyrif Asrama');
  const koordinatorName = koordinator ? koordinator.nama : 'Koordinator Kedisiplinan Unit';

  return {
    header: {
      title: "MUTABA'AH PEMBINAAN SANTRI",
      institution: 'Pesantren Nurul Islam Tengaran',
      levelName: pembinaan.nama_tingkat.toUpperCase(),
      levelNumber: pembinaan.tingkat,
      poinPelanggaran: pelanggaran.poin,
      rangePoin: `${pembinaan.min_poin}–${pembinaan.max_poin} Poin`,
      durasiHari: duration.targetHari,
      toleransiHari: duration.toleransiHari,
      durasiText: `${duration.targetHari} Hari (+ ${duration.toleransiHari} Hari Toleransi)`
    },
    santri: {
      nama: santri.nama,
      nis: santri.nis,
      kelas: santri.kelas,
      kamar: santri.kamar || santri.asrama || '-',
      asrama: santri.asrama || '-',
      unit: santri.unit,
      totalPoin: santri.totalPoin + pelanggaran.poin
    },
    pelanggaran: {
      kode: pelanggaran.kode,
      jenis: pelanggaran.jenis,
      poin: pelanggaran.poin,
      konsekuensi: pelanggaran.konsekuensi
    },
    pembinaan: {
      periodeText: dates.periodeText,
      tanggalMulai: dates.formattedStartDate,
      tanggalTargetSelesai: dates.formattedTargetEndDate,
      tanggalToleransiSelesai: dates.formattedGraceEndDate,
      itemsWithCode
    },
    mutabaahRows,
    officers: {
      musyrifNama: musyrifName,
      koordinatorNama: koordinatorName,
      unitName: santri.unit,
      kotaTanggal: `Tengaran, ${dates.formattedStartDate}`
    }
  };
}
