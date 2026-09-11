import { Santri, Pelanggaran, RiwayatPelanggaran, UserAccount, MasterPembinaan, UnitPesantren, UnitFilter } from '../types';
import { hashPasswordSync } from '../lib/auth';

export const initialUsers: UserAccount[] = [
  // 1. KASIE / KABID (SUPERADMIN) - GLOBAL ACCESS
  {
    id: 'usr-kasie-01',
    nama: 'KH. Abdullah Syukri, M.Ag',
    username: 'kasie',
    role: 'KASIE_KEPESANTRENAN',
    unit: 'ALL',
    is_active: true,
    email: 'kasie@simka.id',
    title: 'Kepala Seksi Kepesantrenan & Kedisiplinan Yayasan',
    password_hash: hashPasswordSync('admin123'),
    created_at: '2026-01-01T00:00:00Z'
  },

  // 2. UNIT SMP
  {
    id: 'usr-koor-smp',
    nama: 'Ust. Hamzah As-Suyuthi, S.Pd.I',
    username: 'koor.smp',
    role: 'KOORDINATOR',
    unit: 'SMP',
    is_active: true,
    email: 'koor.smp@simka.id',
    title: 'Koordinator Kedisiplinan Unit SMP',
    password_hash: hashPasswordSync('smp123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-musy-smp1',
    nama: 'Ust. Salman Al-Farisi',
    username: 'musyrif.smp1',
    role: 'MUSYRIF',
    unit: 'SMP',
    is_active: true,
    email: 'salman.smp@simka.id',
    title: 'Musyrif Asrama SMP (Kelas 7 & 8)',
    password_hash: hashPasswordSync('smp123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-musy-smp2',
    nama: 'Ust. Bilal bin Rabah',
    username: 'musyrif.smp2',
    role: 'MUSYRIF',
    unit: 'SMP',
    is_active: true,
    email: 'bilal.smp@simka.id',
    title: 'Musyrif Asrama SMP (Kelas 9)',
    password_hash: hashPasswordSync('smp123'),
    created_at: '2026-01-01T00:00:00Z'
  },

  // 3. UNIT MA
  {
    id: 'usr-koor-ma',
    nama: 'Ust. Wildan Fanani, Lc',
    username: 'koor.ma',
    role: 'KOORDINATOR',
    unit: 'MA',
    is_active: true,
    email: 'wildan.fanani@simka.id',
    title: 'Koordinator Pembinaan Karakter & Akhlak Santri MA',
    password_hash: hashPasswordSync('ma123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-musy-ma1',
    nama: 'Ust. Ahmad Fauzan, S.Pd',
    username: 'musyrif.ma1',
    role: 'MUSYRIF',
    unit: 'MA',
    is_active: true,
    email: 'ahmad.fauzan@simka.id',
    title: 'Musyrif Asrama MA (Kelas 10)',
    password_hash: hashPasswordSync('ma123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-musy-ma2',
    nama: 'Ust. Ridwan Kamil, Lc',
    username: 'musyrif.ma2',
    role: 'MUSYRIF',
    unit: 'MA',
    is_active: true,
    email: 'ridwan.kamil@simka.id',
    title: 'Musyrif Asrama MA (Kelas 11 & 12)',
    password_hash: hashPasswordSync('ma123'),
    created_at: '2026-01-01T00:00:00Z'
  },

  // 4. UNIT SMA
  {
    id: 'usr-koor-sma',
    nama: 'Ust. Dr. Fathurrahman, M.Pd',
    username: 'koor.sma',
    role: 'KOORDINATOR',
    unit: 'SMA',
    is_active: true,
    email: 'koor.sma@simka.id',
    title: 'Koordinator Kedisiplinan Unit SMA',
    password_hash: hashPasswordSync('sma123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-musy-sma1',
    nama: 'Ust. Tariq bin Ziyad',
    username: 'musyrif.sma1',
    role: 'MUSYRIF',
    unit: 'SMA',
    is_active: true,
    email: 'tariq.sma@simka.id',
    title: 'Musyrif Asrama SMA (Kelas X)',
    password_hash: hashPasswordSync('sma123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-musy-sma2',
    nama: 'Ust. Khalid bin Walid',
    username: 'musyrif.sma2',
    role: 'MUSYRIF',
    unit: 'SMA',
    is_active: true,
    email: 'khalid.sma@simka.id',
    title: 'Musyrif Asrama SMA (Kelas XI & XII)',
    password_hash: hashPasswordSync('sma123'),
    created_at: '2026-01-01T00:00:00Z'
  }
];

export const initialUser = initialUsers[0];

export const initialPelanggaranList: Pelanggaran[] = [
  {
    id: 'p-001',
    kode: 'P001',
    jenis: 'Masbuk / Terlambat Shalat Jamaah',
    kategori: 'Ringan',
    poin: 10,
    konsekuensi: 'Teguran lisan & istighfar'
  },
  {
    id: 'p-002',
    kode: 'P002',
    jenis: 'Membawa Smartphone/Elektronik',
    kategori: 'Sedang',
    poin: 50,
    konsekuensi: 'Penyitaan barang & Surat Peringatan'
  },
  {
    id: 'p-003',
    kode: 'P003',
    jenis: 'Merokok',
    kategori: 'Berat',
    poin: 85,
    konsekuensi: 'Disita dan SP3'
  },
  {
    id: 'p-004',
    kode: 'P004',
    jenis: 'Tidak Sholat Berjamaah di Masjid',
    kategori: 'Ringan',
    poin: 20,
    konsekuensi: 'Push up 40x dan Tilawah 1 Juz'
  },
  {
    id: 'p-005',
    kode: 'P005',
    jenis: 'Ghosob',
    kategori: 'Sedang',
    poin: 35,
    konsekuensi: 'Push up 40x dan Tilawah 1 Juz'
  },
  {
    id: 'p-006',
    kode: 'P006',
    jenis: 'Berkata Kotor',
    kategori: 'Ringan',
    poin: 20,
    konsekuensi: 'Push up 40x'
  },
  {
    id: 'p-007',
    kode: 'P007',
    jenis: 'Pakaian tidak lengkap saat sholat (peci, sarung, koko)',
    kategori: 'Ringan',
    poin: 5,
    konsekuensi: 'Sit up 30 + tilawah 30 menit'
  },
  {
    id: 'p-008',
    kode: 'P008',
    jenis: 'Tidak Mengikuti dzikir/al-ma\'tsurat (bercanda / keluar / mainan)',
    kategori: 'Ringan',
    poin: 5,
    konsekuensi: 'Sit up 45 + tilawah 30 menit'
  },
  {
    id: 'p-009',
    kode: 'P009',
    jenis: 'Membawa, memiliki, menyimpan, dan/atau menyalakan bahan peledak/petasan',
    kategori: 'Berat',
    poin: 100,
    konsekuensi: 'Barang disita dan dimusnahkan'
  },
  {
    id: 'p-010',
    kode: 'P010',
    jenis: 'Berkomunikasi dengan lawan jenis yang bukan mahram',
    kategori: 'Sedang',
    poin: 50,
    konsekuensi: '-'
  },
  {
    id: 'p-011',
    kode: 'P011',
    jenis: 'Menggunakan laptop untuk menonton, chatting, dan browsing terlarang',
    kategori: 'Sedang',
    poin: 50,
    konsekuensi: '-'
  },
  {
    id: 'p-012',
    kode: 'P012',
    jenis: 'Membawa, memiliki, menyimpan, menggunakan senjata tajam',
    kategori: 'Berat',
    poin: 70,
    konsekuensi: 'Barang menjadi sitaan tetap'
  },
  {
    id: 'p-013',
    kode: 'P013',
    jenis: 'Melakukan perbuatan zina, pelecehan seksual atau asusila',
    kategori: 'Berat',
    poin: 100,
    konsekuensi: 'Dikeluarkan'
  },
  {
    id: 'p-014',
    kode: 'P014',
    jenis: 'Bermain benda berbahaya',
    kategori: 'Sedang',
    poin: 50,
    konsekuensi: '-'
  },
  {
    id: 'p-015',
    kode: 'P015',
    jenis: 'Keluar area pesantren tanpa izin/kabur',
    kategori: 'Berat',
    poin: 75,
    konsekuensi: 'Skorsing 1 minggu & SP2'
  },
  {
    id: 'p-016',
    kode: 'P016',
    jenis: 'Terlambat masuk asrama / melanggar jam malam',
    kategori: 'Ringan',
    poin: 15,
    konsekuensi: 'Pembersihan aula & asrama santri'
  }
];

// Pre-defined MA Santri list (Key records preserved)
const specificMASantri: Santri[] = [
  { id: 's-ma-001', nis: '20261001', nama: 'ABDILLAH AKMAL AL FATIH', kelas: '10.1', unit: 'MA', totalPoin: 100, statusPembinaan: 'Dikeluarkan', musyrifId: 'usr-musy-ma1', musyrifNama: 'Ust. Ahmad Fauzan, S.Pd', asrama: 'Asrama Abu Bakar', kamar: 'Abu Bakar 01' },
  { id: 's-ma-002', nis: '20261002', nama: 'ABDUR ROFI', kelas: '11.1', unit: 'MA', totalPoin: 50, statusPembinaan: 'SP 1', musyrifId: 'usr-musy-ma2', musyrifNama: 'Ust. Ridwan Kamil, Lc', asrama: 'Asrama Umar', kamar: 'Umar 03' },
  { id: 's-ma-003', nis: '20261003', nama: 'BIMA MAHARDIKA', kelas: '10.1', unit: 'MA', totalPoin: 0, statusPembinaan: 'Baik', musyrifId: 'usr-musy-ma1', musyrifNama: 'Ust. Ahmad Fauzan, S.Pd', asrama: 'Asrama Abu Bakar', kamar: 'Abu Bakar 02' },
  { id: 's-ma-004', nis: '20261004', nama: 'DAMARGALIH JAFAR MOHAMMAD', kelas: '10.1', unit: 'MA', totalPoin: 100, statusPembinaan: 'SP 3', musyrifId: 'usr-musy-ma1', musyrifNama: 'Ust. Ahmad Fauzan, S.Pd', asrama: 'Asrama Abu Bakar', kamar: 'Abu Bakar 03' },
  { id: 's-ma-005', nis: '20261005', nama: 'FAIDHURRAHMAN INFIROZ', kelas: '10.1', unit: 'MA', totalPoin: 5, statusPembinaan: 'Peringatan Lisan', musyrifId: 'usr-musy-ma1', musyrifNama: 'Ust. Ahmad Fauzan, S.Pd', asrama: 'Asrama Abu Bakar', kamar: 'Abu Bakar 04' },
  { id: 's-ma-006', nis: '20261006', nama: 'HAFIZH KHAIRUN NIAM', kelas: '10.1', unit: 'MA', totalPoin: 100, statusPembinaan: 'SP 3', musyrifId: 'usr-musy-ma1', musyrifNama: 'Ust. Ahmad Fauzan, S.Pd', asrama: 'Asrama Abu Bakar', kamar: 'Abu Bakar 01' },
  { id: 's-ma-007', nis: '20261007', nama: 'HAYA RAIHANAH', kelas: '12.3', unit: 'MA', totalPoin: 50, statusPembinaan: 'SP 1', musyrifId: 'usr-musy-ma2', musyrifNama: 'Ust. Ridwan Kamil, Lc', asrama: 'Asrama Khadijah', kamar: 'Aisyah 05' },
  { id: 's-ma-008', nis: '20261008', nama: 'KUNCORO SATRIO WICAKSONO', kelas: '10.1', unit: 'MA', totalPoin: 0, statusPembinaan: 'Baik', musyrifId: 'usr-musy-ma1', musyrifNama: 'Ust. Ahmad Fauzan, S.Pd', asrama: 'Asrama Abu Bakar', kamar: 'Abu Bakar 02' },
  { id: 's-ma-009', nis: '20261009', nama: 'MUHAMMAD RADIX NUR AL FATIH AN NAWAWI', kelas: '10.2', unit: 'MA', totalPoin: 20, statusPembinaan: 'Peringatan Lisan', musyrifId: 'usr-musy-ma1', musyrifNama: 'Ust. Ahmad Fauzan, S.Pd', asrama: 'Asrama Utsman', kamar: 'Utsman 01' },
  { id: 's-ma-010', nis: '20261010', nama: 'MUHAMMAD SIRAJ', kelas: '10.1', unit: 'MA', totalPoin: 70, statusPembinaan: 'SP 2', musyrifId: 'usr-musy-ma1', musyrifNama: 'Ust. Ahmad Fauzan, S.Pd', asrama: 'Asrama Abu Bakar', kamar: 'Abu Bakar 05' },
  { id: 's-ma-011', nis: '20261011', nama: 'NADIA TSURAYYA ABDILLAH', kelas: '11.2', unit: 'MA', totalPoin: 50, statusPembinaan: 'SP 1', musyrifId: 'usr-musy-ma2', musyrifNama: 'Ust. Ridwan Kamil, Lc', asrama: 'Asrama Khadijah', kamar: 'Khadijah 02' },
  { id: 's-ma-012', nis: '20261012', nama: 'NAUFAL SAQIF IRSYADUL IBAD', kelas: '12.1', unit: 'MA', totalPoin: 5, statusPembinaan: 'Peringatan Lisan', musyrifId: 'usr-musy-ma2', musyrifNama: 'Ust. Ridwan Kamil, Lc', asrama: 'Asrama Ali', kamar: 'Ali 03' },
  { id: 's-ma-013', nis: '20261013', nama: 'TSALISA HANINA DHIYA ULHAQ', kelas: '12.3', unit: 'MA', totalPoin: 50, statusPembinaan: 'SP 1', musyrifId: 'usr-musy-ma2', musyrifNama: 'Ust. Ridwan Kamil, Lc', asrama: 'Asrama Khadijah', kamar: 'Aisyah 04' }
];

// Pre-defined SMP Santri list
const specificSMPSantri: Santri[] = [
  { id: 's-smp-001', nis: '20267001', nama: 'ALIF RAYYAN PRATAMA', kelas: '7A', unit: 'SMP', totalPoin: 20, statusPembinaan: 'Peringatan Lisan', musyrifId: 'usr-musy-smp1', musyrifNama: 'Ust. Salman Al-Farisi', asrama: 'Asrama Thariq', kamar: 'Thariq 01' },
  { id: 's-smp-002', nis: '20267002', nama: 'BILAL AL-GHAZALI', kelas: '7B', unit: 'SMP', totalPoin: 0, statusPembinaan: 'Baik', musyrifId: 'usr-musy-smp1', musyrifNama: 'Ust. Salman Al-Farisi', asrama: 'Asrama Thariq', kamar: 'Thariq 02' },
  { id: 's-smp-003', nis: '20268001', nama: 'DANISH FATHAN RABBANI', kelas: '8A', unit: 'SMP', totalPoin: 35, statusPembinaan: 'SP 1', musyrifId: 'usr-musy-smp1', musyrifNama: 'Ust. Salman Al-Farisi', asrama: 'Asrama Zubair', kamar: 'Zubair 01' },
  { id: 's-smp-004', nis: '20268002', nama: 'DZAKY HILAL MUBARAK', kelas: '8B', unit: 'SMP', totalPoin: 0, statusPembinaan: 'Baik', musyrifId: 'usr-musy-smp1', musyrifNama: 'Ust. Salman Al-Farisi', asrama: 'Asrama Zubair', kamar: 'Zubair 02' },
  { id: 's-smp-005', nis: '20269001', nama: 'FAHRI HAMZAH SYARIF', kelas: '9A', unit: 'SMP', totalPoin: 50, statusPembinaan: 'SP 2', musyrifId: 'usr-musy-smp2', musyrifNama: 'Ust. Bilal bin Rabah', asrama: 'Asrama Saad', kamar: 'Saad 01' },
  { id: 's-smp-006', nis: '20269002', nama: 'HABIB IZZATURRAHMAN', kelas: '9B', unit: 'SMP', totalPoin: 10, statusPembinaan: 'Peringatan Lisan', musyrifId: 'usr-musy-smp2', musyrifNama: 'Ust. Bilal bin Rabah', asrama: 'Asrama Saad', kamar: 'Saad 02' }
];

// Pre-defined SMA Santri list
const specificSMASantri: Santri[] = [
  { id: 's-sma-001', nis: '20266001', nama: 'ARYA BIMA SETIAWAN', kelas: 'X-A', unit: 'SMA', totalPoin: 15, statusPembinaan: 'Peringatan Lisan', musyrifId: 'usr-musy-sma1', musyrifNama: 'Ust. Tariq bin Ziyad', asrama: 'Asrama Khalid', kamar: 'Khalid 01' },
  { id: 's-sma-002', nis: '20266002', nama: 'FARHAN MAULANA WIJAYA', kelas: 'X-B', unit: 'SMA', totalPoin: 0, statusPembinaan: 'Baik', musyrifId: 'usr-musy-sma1', musyrifNama: 'Ust. Tariq bin Ziyad', asrama: 'Asrama Khalid', kamar: 'Khalid 02' },
  { id: 's-sma-003', nis: '20265001', nama: 'IKHSAN NURRAHMAN', kelas: 'XI-IPA', unit: 'SMA', totalPoin: 50, statusPembinaan: 'SP 1', musyrifId: 'usr-musy-sma2', musyrifNama: 'Ust. Khalid bin Walid', asrama: 'Asrama Hamzah', kamar: 'Hamzah 01' },
  { id: 's-sma-004', nis: '20265002', nama: 'MALIK AL-FARUQ', kelas: 'XI-IPS', unit: 'SMA', totalPoin: 70, statusPembinaan: 'SP 2', musyrifId: 'usr-musy-sma2', musyrifNama: 'Ust. Khalid bin Walid', asrama: 'Asrama Hamzah', kamar: 'Hamzah 02' },
  { id: 's-sma-005', nis: '20264001', nama: 'PASHA RADITYA UTOMO', kelas: 'XII-IPA', unit: 'SMA', totalPoin: 0, statusPembinaan: 'Baik', musyrifId: 'usr-musy-sma2', musyrifNama: 'Ust. Khalid bin Walid', asrama: 'Asrama Ja\'far', kamar: 'Ja\'far 01' },
  { id: 's-sma-006', nis: '20264002', nama: 'RIZKI SYAHPUTRA HIDAYAT', kelas: 'XII-IPS', unit: 'SMA', totalPoin: 20, statusPembinaan: 'Peringatan Lisan', musyrifId: 'usr-musy-sma2', musyrifNama: 'Ust. Khalid bin Walid', asrama: 'Asrama Ja\'far', kamar: 'Ja\'far 02' }
];

const sampleFirstNames = [
  'ABDULLAH', 'ADIT', 'AFFAN', 'AHMAD', 'ALIF', 'AMMAR', 'AQIL', 'ARYA', 'AZKA', 'BAGAS',
  'BILAL', 'DANISH', 'DZAKY', 'FADHLI', 'FAHRI', 'FAISAL', 'FARHAN', 'FATHAN', 'FATIH', 'FIKRI',
  'GHALIB', 'HABIB', 'HAMZAH', 'HANIF', 'HASAN', 'HILAL', 'HUSSEIN', 'IBRAHIM', 'IKHSAN', 'ILYAS',
  'IRFAN', 'ISMAIL', 'IZZAT', 'KHALID', 'LUQMAN', 'MALIK', 'MAULANA', 'MIQDAD', 'MUAMMAR', 'NABIH',
  'NAJIB', 'NASRULLAH', 'PASHA', 'RABBANI', 'RADITYA', 'RAFI', 'RAIHAN', 'RASYA', 'RAYYAN', 'REZA',
  'RIDHO', 'RIZKI', 'SALMAN', 'SYAMIL', 'TARIQ', 'UMAR', 'WAHYU', 'YASIN', 'YUSUF', 'ZAID', 'ZAKI'
];

const sampleLastNames = [
  'AL-FARUQ', 'AL-GHAZALI', 'AL-HADDAD', 'AL-QUDSI', 'ANSHARI', 'AR-RASYID', 'ASH-SHIDDIQ', 
  'ATTAMIMI', 'AZ-ZAHIR', 'HAKIM', 'HIDAYAT', 'IBRAHIM', 'KURNIAWAN', 'MAULANA', 'MUBARAK', 
  'MUSTAFA', 'NURRAHMAN', 'PRATAMA', 'PUTRA', 'RAHMAN', 'RAMADHAN', 'SANTOSO', 'SETIAWAN', 
  'SUHADA', 'SYAHPUTRA', 'SYARIF', 'UTOMO', 'WIJAYA', 'WIRATAMA', 'YULIANTO', 'ZULKARNAEN'
];

function generateSantriDataset(): Santri[] {
  const result: Santri[] = [];

  // 1. Add MA Santri (Unit MA sudah memiliki data santri - 163 santri)
  result.push(...specificMASantri);
  const maClasses = ['10.1', '10.2', '10.3', '11.1', '11.2', '11.3', '12.1', '12.2', '12.3'];
  let nameIndex = 0;
  while (result.filter((s) => s.unit === 'MA').length < 163) {
    const fn = sampleFirstNames[nameIndex % sampleFirstNames.length];
    const ln = sampleLastNames[(nameIndex * 3 + 7) % sampleLastNames.length];
    const kl = maClasses[result.length % maClasses.length];
    const idNum = result.filter((s) => s.unit === 'MA').length + 1;
    const padId = idNum.toString().padStart(3, '0');
    
    const randPoin = idNum % 11 === 0 ? 10 : idNum % 19 === 0 ? 20 : 0;
    const status = randPoin > 0 ? 'Peringatan Lisan' : 'Baik';
    const musyrifId = kl.startsWith('10') ? 'usr-musy-ma1' : 'usr-musy-ma2';
    const musyrifNama = kl.startsWith('10') ? 'Ust. Ahmad Fauzan, S.Pd' : 'Ust. Ridwan Kamil, Lc';

    result.push({
      id: `s-ma-${padId}`,
      nis: `20261${padId}`,
      nama: `${fn} ${ln}`,
      kelas: kl,
      unit: 'MA',
      totalPoin: randPoin,
      statusPembinaan: status,
      musyrifId,
      musyrifNama,
      asrama: `Asrama MA Blok ${(idNum % 3) + 1}`,
      kamar: `Kamar 0${(idNum % 6) + 1}`
    });
    nameIndex++;
  }

  // Unit SMP dan SMA dimulai dalam kondisi KOSONG murni (tanpa data fiktif / dummy),
  // siap diisi dengan data asli via Tambah Santri Manual atau Import Excel.
  return result;
}

export const initialSantriList: Santri[] = generateSantriDataset();

export const initialRiwayatPelanggaran: RiwayatPelanggaran[] = [
  // MA Violations
  {
    id: 'log-ma-001',
    tanggal: '25 Agu 2026, 16.38 WIB',
    timestamp: '2026-08-25T16:38:00',
    santriId: 's-ma-002',
    santriNama: 'ABDUR ROFI',
    santriKelas: '11.1',
    santriUnit: 'MA',
    jenisPelanggaranId: 'p-002',
    jenisPelanggaranNama: 'Membawa Smartphone/Elektronik',
    poin: 50,
    hukuman: 'Penyitaan barang & Surat Peringatan',
    status: 'Belum Selesai',
    catatan: 'Ditemukan saat sidak malam di lemari santri.',
    pencatat: 'Ust. Wildan Fanani, Lc',
    pencatatId: 'usr-koor-ma'
  },
  {
    id: 'log-ma-002',
    tanggal: '6 Agu 2026, 23.15 WIB',
    timestamp: '2026-08-06T23:15:00',
    santriId: 's-ma-006',
    santriNama: 'HAFIZH KHAIRUN NIAM',
    santriKelas: '10.1',
    santriUnit: 'MA',
    jenisPelanggaranId: 'p-009',
    jenisPelanggaranNama: 'Membawa, memiliki, menyimpan, dan/atau menyalakan bahan peledak/petasan',
    poin: 100,
    hukuman: 'Barang disita dan dimusnahkan',
    status: 'Selesai',
    catatan: 'Petasan dimusnahkan bersama keamanan pondok.',
    pencatat: 'Ust. Wildan Fanani, Lc',
    pencatatId: 'usr-koor-ma'
  },
  {
    id: 'log-ma-003',
    tanggal: '6 Agu 2026, 23.00 WIB',
    timestamp: '2026-08-06T23:00:00',
    santriId: 's-ma-011',
    santriNama: 'NADIA TSURAYYA ABDILLAH',
    santriKelas: '11.2',
    santriUnit: 'MA',
    jenisPelanggaranId: 'p-010',
    jenisPelanggaranNama: 'Berkomunikasi dengan lawan jenis yang bukan mahram',
    poin: 50,
    hukuman: '-',
    status: 'Belum Selesai',
    catatan: 'Surat panggilan wali santri sudah disiapkan.',
    pencatat: 'Ust. Wildan Fanani, Lc',
    pencatatId: 'usr-koor-ma'
  },
  {
    id: 'log-ma-004',
    tanggal: '6 Agu 2026, 22.56 WIB',
    timestamp: '2026-08-06T22:56:00',
    santriId: 's-ma-013',
    santriNama: 'TSALISA HANINA DHIYA ULHAQ',
    santriKelas: '12.3',
    santriUnit: 'MA',
    jenisPelanggaranId: 'p-011',
    jenisPelanggaranNama: 'Menggunakan laptop untuk menonton, chatting, dan browsing terlarang',
    poin: 50,
    hukuman: '-',
    status: 'Belum Selesai',
    catatan: 'Laptop dititipkan di ruang Kasie.',
    pencatat: 'Ust. Wildan Fanani, Lc',
    pencatatId: 'usr-koor-ma'
  },
  {
    id: 'log-ma-005',
    tanggal: '6 Agu 2026, 22.26 WIB',
    timestamp: '2026-08-06T22:26:00',
    santriId: 's-ma-010',
    santriNama: 'MUHAMMAD SIRAJ',
    santriKelas: '10.1',
    santriUnit: 'MA',
    jenisPelanggaranId: 'p-012',
    jenisPelanggaranNama: 'Membawa, memiliki, menyimpan, menggunakan senjata tajam',
    poin: 70,
    hukuman: 'Barang menjadi sitaan tetap',
    status: 'Selesai',
    catatan: 'Barang berupa pisau lipat tanpa izin.',
    pencatat: 'Ust. Ahmad Fauzan, S.Pd',
    pencatatId: 'usr-musy-ma1'
  },
  {
    id: 'log-ma-006',
    tanggal: '5 Agu 2026, 20.24 WIB',
    timestamp: '2026-08-05T20:24:00',
    santriId: 's-ma-004',
    santriNama: 'DAMARGALIH JAFAR MOHAMMAD',
    santriKelas: '10.1',
    santriUnit: 'MA',
    jenisPelanggaranId: 'p-009',
    jenisPelanggaranNama: 'Membawa, memiliki, menyimpan, dan/atau menyalakan bahan peledak/petasan',
    poin: 100,
    hukuman: 'Barang disita dan dimusnahkan',
    status: 'Selesai',
    catatan: 'Dilakukan pembinaan langsung di kantor Kasie.',
    pencatat: 'Ust. Wildan Fanani, Lc',
    pencatatId: 'usr-koor-ma'
  },
  {
    id: 'log-ma-007',
    tanggal: '5 Agu 2026, 19.50 WIB',
    timestamp: '2026-08-05T19:50:00',
    santriId: 's-ma-001',
    santriNama: 'ABDILLAH AKMAL AL FATIH',
    santriKelas: '10.1',
    santriUnit: 'MA',
    jenisPelanggaranId: 'p-013',
    jenisPelanggaranNama: 'Melakukan perbuatan zina, pelecehan seksual atau asusila',
    poin: 100,
    hukuman: 'Dikeluarkan',
    status: 'Selesai',
    catatan: 'Keputusan sidang dewan guru dan pimpinan pesantren.',
    pencatat: 'Ust. Ahmad Fauzan, S.Pd',
    pencatatId: 'usr-musy-ma1'
  }
];

export const initialMasterPembinaanList: MasterPembinaan[] = [
  {
    id: 'pb-001',
    tingkat: 1,
    nama_tingkat: 'Tingkat 1',
    min_poin: 90,
    max_poin: 99,
    jenis_pembinaan: [
      'Membaca istighfar 300 kali/hari selama satu pekan',
      'Menyikat dan membersihkan kamar mandi selama 14 hari',
      'Skorsing tanpa syarat',
      'Qiyamullail satu pekan (harus terkonfirmasi)',
      'Membuat surat pernyataan',
      'Mendapatkan surat peringatan',
      'Absen rutin kepada pimpinan sekolah/madrasah, Koordinator Unit Pesantren, dan/atau pihak yang ditunjuk selama minimal 14 hari',
      'Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk',
      'Tidak diizinkan keluar area pondok ketika perizinan/Kepulangan/Ahad keluar sebanyak 3 kali',
      'Digundul dan memakai pakaian khusus pelanggaran',
      'Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-002',
    tingkat: 2,
    nama_tingkat: 'Tingkat 2',
    min_poin: 70,
    max_poin: 89,
    jenis_pembinaan: [
      'Membaca istighfar 300 kali/hari selama 3 hari',
      'Menyikat dan membersihkan kamar mandi selama 10 – 14 hari',
      'Skorsing dengan syarat',
      'Qiyamullail satu pekan (harus terkonfirmasi)',
      'Membuat surat pernyataan',
      'Mendapatkan surat peringatan',
      'Absen rutin kepada pimpinan sekolah/madrasah, Koordinator Unit Pesantren, dan/atau pihak yang ditunjuk selama minimal 10 hari',
      'Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk',
      'Tidak diizinkan keluar area pondok ketika perizinan/Kepulangan/Ahad keluar sebanyak 2 kali',
      'Digundul atau memakai pakaian khusus pelanggaran',
      'Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-003',
    tingkat: 3,
    nama_tingkat: 'Tingkat 3',
    min_poin: 50,
    max_poin: 69,
    jenis_pembinaan: [
      'Membaca istighfar 700 kali',
      'Menyikat dan membersihkan kamar mandi selama 5 – 9 hari',
      'Skorsing dengan syarat',
      'Qiyamullail satu pekan (harus terkonfirmasi)',
      'Membuat surat pernyataan',
      'Mendapatkan surat peringatan',
      'Absen rutin kepada pimpinan sekolah/madrasah, Koordinator Unit Pesantren, dan/atau pihak yang ditunjuk selama minimal 5 hari',
      'Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk',
      'Tidak diizinkan keluar area pondok ketika perizinan/Kepulangan/Ahad keluar sebanyak 1 kali',
      'Gundul atau memakai pakaian pelanggaran',
      'Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-004',
    tingkat: 4,
    nama_tingkat: 'Tingkat 4',
    min_poin: 35,
    max_poin: 49,
    jenis_pembinaan: [
      'Membaca istighfar 500 kali',
      'Menyikat dan membersihkan kamar mandi selama 3 – 7 hari',
      'Skorsing dengan syarat',
      'Qiyamullail tiga malam (harus terkonfirmasi)',
      'Membuat surat pernyataan',
      'Mendapatkan surat peringatan',
      'Absen rutin kepada pimpinan sekolah/madrasah, Koordinator Unit Pesantren, dan/atau pihak yang ditunjuk selama minimal 3 hari',
      'Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk',
      'Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-005',
    tingkat: 5,
    nama_tingkat: 'Tingkat 5',
    min_poin: 31,
    max_poin: 34,
    jenis_pembinaan: [
      'Membaca istighfar sebanyak 300 kali',
      'Menyikat dan membersihkan kamar mandi selama 1 hari',
      'Menulis ulang ayat/hadits sejumlah yang ditentukan dan menghafalnya atau mendapatkan penugasan praktik dan/atau tertulis terkait pelanggaran yang dilakukan',
      'Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk',
      'Tidak mengulangi kesalahan serupa selama minimal 4 pekan',
      'Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-006',
    tingkat: 6,
    nama_tingkat: 'Tingkat 6',
    min_poin: 21,
    max_poin: 30,
    jenis_pembinaan: [
      'Membaca istighfar sebanyak 200 kali',
      'Menyapu dan mengepel lantai selama 3 hari',
      'Menulis ulang ayat/hadits sejumlah yang ditentukan dan menghafalnya atau mendapatkan penugasan praktik dan/atau tertulis terkait pelanggaran yang dilakukan',
      'Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk',
      'Tidak mengulangi kesalahan serupa selama minimal 2 pekan',
      'Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-007',
    tingkat: 7,
    nama_tingkat: 'Tingkat 7',
    min_poin: 11,
    max_poin: 20,
    jenis_pembinaan: [
      'Membaca istighfar sehari 100 kali',
      'Menyapu dan mengepel lantai selama 1 hari',
      'Menghafal ayat/hadits atau mendapatkan penugasan tertulis terkait pelanggaran yang dilakukan',
      'Tidak mengulangi kesalahan serupa selama minimal 1 pekan',
      'Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-008',
    tingkat: 8,
    nama_tingkat: 'Tingkat 8',
    min_poin: 5,
    max_poin: 10,
    jenis_pembinaan: [
      'Membaca istighfar 33 kali',
      'Menyiram tanaman di sekitar sekolah/pesantren',
      'Menghafal mufradat dan disetorkan/mendapatkan penugasan tertulis berkaitan dengan pelanggaran yang dilakukan',
      'Tidak mengulangi kesalahan yang sama selama minimal 3 hari',
      'Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait'
    ],
    is_active: true
  }
];

export const initialPembinaanRecords = [
  {
    id: 'pbn-001',
    santriId: 's-ma-001',
    santriNama: 'MUHAMMAD ILHAM FAHREZI',
    santriKelas: '11.1',
    santriUnit: 'MA' as const,
    pelanggaranTerkaitId: 'plg-031',
    pelanggaranTerkaitJenis: 'Merokok atau membawa rokok/vape',
    jenisPembinaan: 'Tugas pembinaan & Hafalan',
    tanggal: '05 Sep 2026',
    tanggalTargetSelesai: '12 Sep 2026',
    pembina: 'Ust. Wildan Fanani, Lc',
    pembinaId: 'usr-koor-ma',
    catatan: 'Menghafal Surat Al-Mulk ayat 1-15 dan membersihkan masjid pondok selama 3 hari.',
    status: 'PROSES' as const,
    created_at: '2026-09-05T08:00:00Z'
  },
  {
    id: 'pbn-002',
    santriId: 's-ma-004',
    santriNama: 'RIZKY RAMADHAN',
    santriKelas: '10.2',
    santriUnit: 'MA' as const,
    pelanggaranTerkaitId: 'plg-024',
    pelanggaranTerkaitJenis: 'Membawa / menggunakan HP tanpa izin',
    jenisPembinaan: 'Surat Pernyataan & Kebersihan',
    tanggal: '02 Sep 2026',
    tanggalTargetSelesai: '06 Sep 2026',
    pembina: 'Ust. Ahmad Fauzan, S.Pd',
    pembinaId: 'usr-musy-ma1',
    catatan: 'HP diamankan selama 1 bulan. Santri membuat surat pernyataan tidak mengulangi.',
    status: 'SELESAI' as const,
    tanggalSelesai: '06 Sep 2026',
    created_at: '2026-09-02T10:30:00Z'
  },
  {
    id: 'pbn-003',
    santriId: 's-ma-002',
    santriNama: 'ACHMAD FADILLAH',
    santriKelas: '10.1',
    santriUnit: 'MA' as const,
    pelanggaranTerkaitId: 'plg-001',
    pelanggaranTerkaitJenis: 'Terlambat shalat berjamaah di masjid',
    jenisPembinaan: 'Teguran/Nasihat & Istighfar',
    tanggal: '08 Sep 2026',
    tanggalTargetSelesai: '10 Sep 2026',
    pembina: 'Ust. Ahmad Fauzan, S.Pd',
    pembinaId: 'usr-musy-ma1',
    catatan: 'Diberikan nasihat dan membaca istighfar 100x.',
    status: 'BELUM DIMULAI' as const,
    created_at: '2026-09-08T05:15:00Z'
  }
];

