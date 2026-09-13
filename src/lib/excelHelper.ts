import { utils, write, read } from 'xlsx';
import { UnitPesantren, UserRole, UserAccount, Pelanggaran, RiwayatPelanggaran } from '../types';
import { getKategoriFromPoin, KategoriPelanggaranType } from '../components/common/PointBadge';

/**
 * Safely sanitize and truncate Excel sheet names (max 31 characters, remove invalid chars \ / ? * : [ ])
 */
export function sanitizeSheetName(name: string, fallback = 'Sheet1'): string {
  if (!name || typeof name !== 'string') return fallback;
  const sanitized = name.replace(/[\\/?*:[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!sanitized) return fallback;
  return sanitized.slice(0, 31);
}

export interface SantriImportRow {
  rowNumber: number;
  nis: string;
  nama: string;
  unit: UnitPesantren;
  kelas: string;
  musyrif: string;
  asrama?: string;
  kamar?: string;
  statusPembinaan?: string;
  keterangan?: string;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
  resolvedMusyrifId?: string;
  resolvedMusyrifNama?: string;
}

export interface PelanggaranImportRow {
  rowNumber: number;
  no?: string;
  kode: string;
  jenis: string;
  poin: number;
  kategoriAsli?: string;
  kategoriDihitung: KategoriPelanggaranType;
  kategoriWarning?: string;
  konsekuensi: string;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
}

export interface UserImportRow {
  rowNumber: number;
  id: string;
  nama: string;
  username: string;
  passwordRaw: string;
  email?: string;
  role: UserRole;
  unit: 'ALL' | UnitPesantren;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
}

// ============================================================================
// DATA PELANGGARAN EXCEL HELPERS
// ============================================================================

/**
 * Generate and download template Excel for Master Pelanggaran Import
 * Columns: | No | Item Pelanggaran | Poin | Kategori Pelanggaran | Hukuman / Konsekuensi |
 */
export function generatePelanggaranExcelTemplate(): void {
  const headers = [
    'No',
    'Item Pelanggaran',
    'Poin',
    'Kategori Pelanggaran',
    'Hukuman / Konsekuensi'
  ];

  const sampleRows = [
    [
      57,
      'Vandalisme (coret-coret / merusak fasilitas / lainnya)',
      15,
      'Sangat Ringan',
      'teguran lisan + tilawah 30 menit'
    ],
    [
      58,
      'Bermain diluar jam dan tempat yang ditentukan',
      15,
      'Sangat Ringan',
      'teguran lisan + tilawah 30 menit'
    ],
    [
      59,
      'Mengotori lingkungan pesantren sengaja atau tidak disengaja (sampah, sepatu)',
      15,
      'Sangat Ringan',
      '-'
    ],
    [
      60,
      'Pulang/keluar tanpa konfirmasi wali kamar',
      15,
      'Sangat Ringan',
      'Teguran lisan'
    ],
    [
      61,
      "Tidak hadir halaqoh tanpa udzur syar'i",
      15,
      'Sangat Ringan',
      'teguran lisan + tilawah 30 menit'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },  // No
    { wch: 65 }, // Item Pelanggaran
    { wch: 10 }, // Poin
    { wch: 22 }, // Kategori Pelanggaran
    { wch: 45 }  // Hukuman / Konsekuensi
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Master Pelanggaran');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Pelanggaran_SIMKA.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Master Pelanggaran to Excel (Restricted to Kasie)
 */
export function exportPelanggaranToExcel(
  pelanggaranList: Pelanggaran[],
  filenamePrefix = 'Master_Data_Pelanggaran',
  userRole?: UserRole
): void {
  if (userRole && userRole !== 'KASIE_KEPESANTRENAN') {
    throw new Error('Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengekspor data master.');
  }

  const headers = [
    'No',
    'Kode',
    'Item Pelanggaran',
    'Poin',
    'Kategori Pelanggaran',
    'Hukuman / Konsekuensi'
  ];

  const dataRows = pelanggaranList.map((item, idx) => {
    const calculatedKategori = getKategoriFromPoin(item.poin).kategori;
    return [
      idx + 1,
      item.kode || `P${String(idx + 1).padStart(3, '0')}`,
      item.jenis,
      item.poin,
      calculatedKategori,
      item.konsekuensi || '-'
    ];
  });

  const wsData = [headers, ...dataRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 10 },
    { wch: 65 },
    { wch: 10 },
    { wch: 22 },
    { wch: 45 }
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Kamus Pelanggaran');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate Excel file for Master Pelanggaran with Auto-Category calculation and anti-duplication
 */
export async function parsePelanggaranExcel(
  file: File,
  existingList: Pelanggaran[]
): Promise<{
  rows: PelanggaranImportRow[];
  validCount: number;
  duplicateCount: number;
  errorCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson: any[][] = utils.sheet_to_json(worksheet, { header: 1 });

  if (rawJson.length < 2) {
    throw new Error('File Excel kosong atau tidak memiliki baris data.');
  }

  // Find column indices with precision to prevent mixing 'No' / 'Kategori' with 'Item Pelanggaran'
  const headerRow = rawJson[0].map((h: any) => String(h || '').trim().toLowerCase());
  
  // 1. Column No
  let colNo = headerRow.findIndex((h) => /^no(\.|\s|$)|nomor|^#$/i.test(h) && !h.includes('item') && !h.includes('jenis') && !h.includes('kategori'));
  
  // 2. Column Kode (if present)
  let colKode = headerRow.findIndex((h) => /^(kode|kd)(\.|\s|_|$)/i.test(h) && !h.includes('item'));

  // 3. Column Kategori
  let colKategori = headerRow.findIndex((h) => h.includes('kategori') || h.includes('tingkat'));

  // 4. Column Poin / Skor
  let colPoin = headerRow.findIndex((h) => h.includes('poin') || h.includes('bobot') || h.includes('skor') || h.includes('nilai'));

  // 5. Column Hukuman / Konsekuensi / Sanksi
  let colHukuman = headerRow.findIndex((h) => h.includes('hukuman') || h.includes('konsekuensi') || h.includes('sanksi') || h.includes('tindakan'));

  // 6. Column Item / Jenis Pelanggaran (must NOT be No, Kode, Kategori, Poin, or Hukuman)
  let colJenis = headerRow.findIndex((h, idx) => {
    if (idx === colNo || idx === colKode || idx === colKategori || idx === colPoin || idx === colHukuman) return false;
    return (
      h.includes('item pelanggaran') ||
      h.includes('jenis pelanggaran') ||
      h.includes('nama pelanggaran') ||
      h.includes('deskripsi') ||
      h.includes('pelanggaran') ||
      h.includes('item') ||
      h.includes('jenis') ||
      h.includes('nama')
    );
  });

  // Fallback positional indexing if headers are not clear
  if (colJenis === -1) {
    // Pick first column that is not No/Poin/Hukuman/Kategori
    const available = headerRow.map((_, i) => i).filter(i => i !== colNo && i !== colPoin && i !== colKategori && i !== colHukuman && i !== colKode);
    colJenis = available.length > 0 ? available[0] : (colNo === 0 ? 1 : 0);
  }
  if (colPoin === -1) {
    colPoin = headerRow.length > 2 ? 2 : (headerRow.length > 1 ? 1 : 0);
  }
  if (colKategori === -1) {
    colKategori = headerRow.length > 3 ? 3 : -1;
  }
  if (colHukuman === -1) {
    colHukuman = headerRow.length > 4 ? 4 : (headerRow.length > 3 ? 3 : -1);
  }

  const existingJenisSet = new Set(
    existingList.map((p) => p.jenis.trim().toLowerCase().replace(/\s+/g, ' '))
  );
  const existingKodeSet = new Set(
    existingList.map((p) => (p.kode || '').trim().toLowerCase())
  );

  const seenInCurrentBatch = new Set<string>();
  const parsedRows: PelanggaranImportRow[] = [];

  for (let i = 1; i < rawJson.length; i++) {
    const row = rawJson[i];
    if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
      continue; // Skip empty rows
    }

    const rawNo = colNo !== -1 && row[colNo] !== undefined ? String(row[colNo]).trim() : String(i);
    const rawJenis = row[colJenis] !== undefined ? String(row[colJenis]).trim() : '';
    const rawPoin = row[colPoin] !== undefined ? Number(row[colPoin]) : NaN;
    const rawKategori = row[colKategori] !== undefined ? String(row[colKategori]).trim() : '';
    const rawHukuman = row[colHukuman] !== undefined ? String(row[colHukuman]).trim() : '-';

    // Validation
    if (!rawJenis) {
      parsedRows.push({
        rowNumber: i + 1,
        no: rawNo,
        kode: `P${String(i).padStart(3, '0')}`,
        jenis: '(Kosong)',
        poin: 0,
        kategoriAsli: rawKategori,
        kategoriDihitung: 'Sangat Ringan',
        konsekuensi: rawHukuman,
        status: 'error',
        errorMessage: 'Item Pelanggaran wajib diisi.'
      });
      continue;
    }

    if (isNaN(rawPoin) || rawPoin < 1) {
      parsedRows.push({
        rowNumber: i + 1,
        no: rawNo,
        kode: `P${String(i).padStart(3, '0')}`,
        jenis: rawJenis,
        poin: 0,
        kategoriAsli: rawKategori,
        kategoriDihitung: 'Sangat Ringan',
        konsekuensi: rawHukuman,
        status: 'error',
        errorMessage: 'Poin harus berupa angka positif (minimal 1).'
      });
      continue;
    }

    // Auto-calculate Category based strictly on Points
    const calculatedKategori = getKategoriFromPoin(rawPoin).kategori;
    let kategoriWarning: string | undefined = undefined;

    if (rawKategori && rawKategori.toLowerCase() !== calculatedKategori.toLowerCase()) {
      kategoriWarning = `Kategori di file ("${rawKategori}") disesuaikan otomatis menjadi "${calculatedKategori}" berdasarkan bobot ${rawPoin} poin.`;
    }

    // Anti-duplication check
    const normalizedKey = rawJenis.toLowerCase().replace(/\s+/g, ' ');
    if (existingJenisSet.has(normalizedKey) || seenInCurrentBatch.has(normalizedKey)) {
      parsedRows.push({
        rowNumber: i + 1,
        no: rawNo,
        kode: `P${String(i).padStart(3, '0')}`,
        jenis: rawJenis,
        poin: rawPoin,
        kategoriAsli: rawKategori,
        kategoriDihitung: calculatedKategori,
        kategoriWarning,
        konsekuensi: rawHukuman || '-',
        status: 'duplicate',
        errorMessage: 'Duplikat — Item pelanggaran sudah ada di sistem.'
      });
      continue;
    }

    seenInCurrentBatch.add(normalizedKey);

    parsedRows.push({
      rowNumber: i + 1,
      no: rawNo,
      kode: `P${String(existingList.length + parsedRows.length + 1).padStart(3, '0')}`,
      jenis: rawJenis,
      poin: rawPoin,
      kategoriAsli: rawKategori,
      kategoriDihitung: calculatedKategori,
      kategoriWarning,
      konsekuensi: rawHukuman || '-',
      status: 'valid'
    });
  }

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter((r) => r.status === 'duplicate').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;

  return { rows: parsedRows, validCount, duplicateCount, errorCount };
}

// ============================================================================
// DATA PENGGUNA EXCEL HELPERS
// ============================================================================

/**
 * Generate and download template Excel for Users Import
 * Columns: | id | nama | username | password | email (opsional) | role | unit |
 */
export function generateUserExcelTemplate(): void {
  const headers = [
    'id',
    'nama',
    'username',
    'password',
    'email (opsional)',
    'role',
    'unit'
  ];

  const sampleRows = [
    [
      'U001',
      'Ust. Ahmad Al-Haddad, S.Pd',
      'ahmad.musy',
      'ahmad123',
      'ahmad@simka.id',
      'Musyrif',
      'MA'
    ],
    [
      'U002',
      'Ustzh. Fatimah Az-Zahra, S.Ag',
      'fatimah.musy',
      'fatimah123',
      'fatimah@simka.id',
      'Musyrif',
      'MA'
    ],
    [
      'U003',
      'Ust. Hasan Basri, M.Pd',
      'hasan.koor',
      'hasan123',
      'hasan@simka.id',
      'Koordinator',
      'SMP'
    ],
    [
      'U004',
      'Ust. Fathurrahman Al-Makki',
      'fathur.sma',
      'sma123',
      'fathur@simka.id',
      'Musyrif',
      'SMA'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 10 }, // ID
    { wch: 32 }, // Nama
    { wch: 20 }, // Username
    { wch: 18 }, // Password
    { wch: 26 }, // Email
    { wch: 22 }, // Role
    { wch: 10 }  // Unit
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Pengguna');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Pengguna_SIMKA.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Users list to Excel (NEVER exports password or password_hash!)
 */
export function exportUsersToExcel(
  usersList: UserAccount[],
  filenamePrefix = 'Data_Pengguna_SIMKA'
): void {
  const headers = [
    'ID',
    'Nama Lengkap',
    'Username',
    'Email',
    'Role',
    'Unit',
    'Status'
  ];

  const dataRows = usersList.map((u) => [
    u.id,
    u.nama,
    u.username,
    u.email || '-',
    u.role,
    u.unit,
    u.is_active ? 'Aktif' : 'Nonaktif'
  ]);

  const wsData = [headers, ...dataRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 16 },
    { wch: 34 },
    { wch: 20 },
    { wch: 26 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 }
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Daftar Pengguna');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate Excel file for Users Import
 */
export async function parseUsersExcel(
  file: File,
  existingUsers: UserAccount[]
): Promise<{
  rows: UserImportRow[];
  validCount: number;
  duplicateCount: number;
  errorCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson: any[][] = utils.sheet_to_json(worksheet, { header: 1 });

  if (rawJson.length < 2) {
    throw new Error('File Excel kosong atau tidak memiliki baris data.');
  }

  const headerRow = rawJson[0].map((h: any) => String(h || '').trim().toLowerCase());

  let colId = headerRow.findIndex((h) => h === 'id' || h.includes('id '));
  let colNama = headerRow.findIndex((h) => h.includes('nama'));
  let colUsername = headerRow.findIndex((h) => h.includes('username') || h.includes('user'));
  let colPassword = headerRow.findIndex((h) => h.includes('password') || h.includes('sandi') || h.includes('pass'));
  let colEmail = headerRow.findIndex((h) => h.includes('email') || h.includes('mail'));
  let colRole = headerRow.findIndex((h) => h.includes('role') || h.includes('peran') || h.includes('jabatan'));
  let colUnit = headerRow.findIndex((h) => h.includes('unit') || h.includes('jenjang'));

  if (colId === -1) colId = 0;
  if (colNama === -1) colNama = 1;
  if (colUsername === -1) colUsername = 2;
  if (colPassword === -1) colPassword = 3;
  if (colEmail === -1) colEmail = 4;
  if (colRole === -1) colRole = 5;
  if (colUnit === -1) colUnit = 6;

  const existingUsernameSet = new Set(
    existingUsers.map((u) => u.username.trim().toLowerCase())
  );
  const existingIdSet = new Set(
    existingUsers.map((u) => u.id.trim().toLowerCase())
  );
  const seenUsernameBatch = new Set<string>();

  const parsedRows: UserImportRow[] = [];

  for (let i = 1; i < rawJson.length; i++) {
    const row = rawJson[i];
    if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
      continue;
    }

    const rawId = colId !== -1 && row[colId] ? String(row[colId]).trim() : `U${String(i).padStart(3, '0')}`;
    const rawNama = row[colNama] !== undefined ? String(row[colNama]).trim() : '';
    const rawUsername = row[colUsername] !== undefined ? String(row[colUsername]).trim().toLowerCase() : '';
    const rawPassword = row[colPassword] !== undefined ? String(row[colPassword]).trim() : '';
    const rawEmail = colEmail !== -1 && row[colEmail] !== undefined ? String(row[colEmail]).trim() : '';
    const rawRole = row[colRole] !== undefined ? String(row[colRole]).trim() : '';
    const rawUnit = row[colUnit] !== undefined ? String(row[colUnit]).trim().toUpperCase() : '';

    // Required fields check
    if (!rawNama) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId,
        nama: '(Kosong)',
        username: rawUsername || '-',
        passwordRaw: '',
        email: rawEmail,
        role: 'MUSYRIF',
        unit: 'SMP',
        status: 'error',
        errorMessage: 'Nama pengguna wajib diisi.'
      });
      continue;
    }

    if (!rawUsername) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId,
        nama: rawNama,
        username: '(Kosong)',
        passwordRaw: '',
        email: rawEmail,
        role: 'MUSYRIF',
        unit: 'SMP',
        status: 'error',
        errorMessage: 'Username wajib diisi.'
      });
      continue;
    }

    if (!rawPassword || rawPassword.length < 6) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId,
        nama: rawNama,
        username: rawUsername,
        passwordRaw: '',
        email: rawEmail,
        role: 'MUSYRIF',
        unit: 'SMP',
        status: 'error',
        errorMessage: 'Password wajib diisi minimal 6 karakter.'
      });
      continue;
    }

    // Role mapping
    let resolvedRole: UserRole | null = null;
    const cleanRoleStr = rawRole.toUpperCase().replace(/\s+/g, '_');
    if (cleanRoleStr.includes('MUSYRIF')) {
      resolvedRole = 'MUSYRIF';
    } else if (cleanRoleStr.includes('KOORDINATOR')) {
      resolvedRole = 'KOORDINATOR';
    } else if (cleanRoleStr.includes('KASIE') || cleanRoleStr.includes('KABID') || cleanRoleStr.includes('SUPERADMIN')) {
      resolvedRole = 'KASIE_KEPESANTRENAN';
    }

    if (!resolvedRole) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId,
        nama: rawNama,
        username: rawUsername,
        passwordRaw: rawPassword,
        email: rawEmail,
        role: 'MUSYRIF',
        unit: 'SMP',
        status: 'error',
        errorMessage: `Role tidak valid ("${rawRole}"). Pilih Musyrif, Koordinator, atau Kasie Kepesantrenan.`
      });
      continue;
    }

    // Unit validation based on role
    let resolvedUnit: 'ALL' | UnitPesantren = 'ALL';
    if (resolvedRole === 'KASIE_KEPESANTRENAN') {
      resolvedUnit = 'ALL';
    } else {
      if (rawUnit === 'SMP' || rawUnit === 'MA' || rawUnit === 'SMA') {
        resolvedUnit = rawUnit as UnitPesantren;
      } else {
        parsedRows.push({
          rowNumber: i + 1,
          id: rawId,
          nama: rawNama,
          username: rawUsername,
          passwordRaw: rawPassword,
          email: rawEmail,
          role: resolvedRole,
          unit: 'SMP',
          status: 'error',
          errorMessage: `Unit untuk role ${resolvedRole} harus salah satu: SMP, MA, atau SMA (terisi: "${rawUnit}").`
        });
        continue;
      }
    }

    // Uniqueness & duplication check
    if (existingUsernameSet.has(rawUsername) || seenUsernameBatch.has(rawUsername)) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId,
        nama: rawNama,
        username: rawUsername,
        passwordRaw: rawPassword,
        email: rawEmail,
        role: resolvedRole,
        unit: resolvedUnit,
        status: 'duplicate',
        errorMessage: `Username "@${rawUsername}" sudah digunakan di sistem.`
      });
      continue;
    }

    seenUsernameBatch.add(rawUsername);

    parsedRows.push({
      rowNumber: i + 1,
      id: rawId || `U${String(existingUsers.length + parsedRows.length + 1).padStart(3, '0')}`,
      nama: rawNama,
      username: rawUsername,
      passwordRaw: rawPassword,
      email: rawEmail || `${rawUsername}@simka.id`,
      role: resolvedRole,
      unit: resolvedUnit,
      status: 'valid'
    });
  }

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter((r) => r.status === 'duplicate').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;

  return { rows: parsedRows, validCount, duplicateCount, errorCount };
}

// ============================================================================
// SANTRI EXCEL HELPERS (PRESERVED)
// ============================================================================

/**
 * Generate and download template Excel for Santri Import
 */
export function generateSantriExcelTemplate(): void {
  const headers = [
    'Kode/NIS',
    'Nama Santri',
    'Unit',
    'Kelas',
    'Musyrif',
    'Asrama/Kamar',
    'Status Pembinaan',
    'Keterangan'
  ];

  const instructionRow = [
    '#CONTOH: 20261050',
    '#CONTOH: AHMAD FAUZI',
    '#PILIH: SMP / MA / SMA',
    '#CONTOH: 7A / 10.1 / X-A',
    '#NAMA MUSYRIF SESUAI UNIT',
    '#CONTOH: Asrama Abu Bakar / 01',
    '#OPSIONAL (Default: Baik)',
    '#OPSIONAL'
  ];

  const wsData = [headers, instructionRow];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 16 },
    { wch: 32 },
    { wch: 10 },
    { wch: 12 },
    { wch: 28 },
    { wch: 26 },
    { wch: 18 },
    { wch: 24 }
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Template Santri');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Santri_SIMKA.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to format date into DD/MM/YYYY
 */
function formatViolationDateForExcel(dateStr?: string): string {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).trim();
  // If format is YYYY-MM-DD or starts with YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    const parts = cleanStr.slice(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  // If format is already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanStr)) {
    return cleanStr.slice(0, 10);
  }
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}/${mon}/${yr}`;
  }
  return cleanStr;
}

/**
 * Export Santri list to Excel (Restricted to Kasie)
 * Includes full violation history per santri in 'Riwayat Pelanggaran' column with Pelapor details.
 */
export function exportSantriToExcel(
  santriList: Array<{
    id?: string;
    nis: string;
    nama: string;
    unit: string;
    kelas: string;
    musyrifNama?: string;
    asrama?: string;
    kamar?: string;
    totalPoin: number;
    statusPembinaan?: string;
    keterangan?: string;
  }>,
  unitLabel: string,
  userRole?: UserRole,
  riwayatList?: RiwayatPelanggaran[]
): void {
  if (userRole && userRole !== 'KASIE_KEPESANTRENAN') {
    throw new Error('Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengekspor data santri.');
  }

  const headers = [
    'No',
    'Kode / NIS',
    'Nama Santri',
    'Unit',
    'Kelas',
    'Musyrif Pembina',
    'Gedung Asrama',
    'Kamar',
    'Total Poin',
    'Riwayat Pelanggaran',
    'Keterangan'
  ];

  const dataRows = santriList.map((s, index) => {
    // Collect and format violation history for this santri
    let riwayatText = 'Belum ada pelanggaran';
    if (riwayatList && riwayatList.length > 0) {
      const santriLogs = riwayatList.filter((r) => {
        if (s.id && r.santriId && r.santriId === s.id) return true;
        if (s.nama && r.santriNama && r.santriNama.trim().toLowerCase() === s.nama.trim().toLowerCase()) return true;
        return false;
      });

      if (santriLogs.length > 0) {
        // Sort newest to oldest
        const sortedLogs = [...santriLogs].sort((a, b) => {
          const timeA = new Date(a.tanggal).getTime() || 0;
          const timeB = new Date(b.tanggal).getTime() || 0;
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        });

        riwayatText = sortedLogs
          .map((r) => {
            const tgl = formatViolationDateForExcel(r.tanggal);
            const jenis = r.jenisPelanggaranNama || 'Pelanggaran';
            const poin = r.poin ?? 0;
            const pelapor = (r.pencatat && r.pencatat.trim()) ? r.pencatat.trim() : 'Petugas';
            return `${tgl} — ${jenis} — ${poin} poin — Pelapor: ${pelapor}`;
          })
          .join('\r\n');
      }
    }

    return [
      index + 1,
      s.nis || '-',
      s.nama || '-',
      s.unit || '-',
      s.kelas || '-',
      s.musyrifNama || '-',
      s.asrama || '-',
      s.kamar || '-',
      s.totalPoin ?? 0,
      riwayatText,
      s.keterangan || '-'
    ];
  });

  const wsData = [headers, ...dataRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 6 },   // No
    { wch: 16 },  // Kode / NIS
    { wch: 34 },  // Nama Santri
    { wch: 8 },   // Unit
    { wch: 10 },  // Kelas
    { wch: 28 },  // Musyrif Pembina
    { wch: 22 },  // Gedung Asrama
    { wch: 12 },  // Kamar
    { wch: 12 },  // Total Poin
    { wch: 70 },  // Riwayat Pelanggaran
    { wch: 26 }   // Keterangan
  ];

  const wb = utils.book_new();
  const safeSheetName = sanitizeSheetName(`Santri ${unitLabel}`, 'Data Santri');
  utils.book_append_sheet(wb, ws, safeSheetName);

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanLabel = (unitLabel || 'Semua').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Data_Santri_${cleanLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
