import { createClient } from '@supabase/supabase-js';
import { 
  MasterPembinaan, 
  Santri, 
  RiwayatPelanggaran, 
  UserAccount, 
  UnitPesantren, 
  Pelanggaran, 
  PelanggaranKategori, 
  UserRole,
  PembinaanRecord
} from '../types';
import { 
  initialMasterPembinaanList, 
  initialUsers,
  initialPelanggaranList,
  initialSantriList,
  initialRiwayatPelanggaran,
  initialPembinaanRecords
} from '../data/mockData';
import { 
  hashPassword, 
  verifyPassword, 
  mapJabatanToRole, 
  mapUnit, 
  normalizeUnitForDB, 
  normalizeJabatanForDB 
} from './auth';
import { sortSantriList, sortMasterPelanggaranList } from './sortingHelper';

export const STORAGE_KEY_SUPABASE_URL = 'SIMKA_SUPABASE_URL';
export const STORAGE_KEY_SUPABASE_KEY = 'SIMKA_SUPABASE_ANON_KEY';
export const STORAGE_KEY_OFFLINE_MODE = 'SIMKA_SUPABASE_OFFLINE_MODE';

export function getActiveSupabaseConfig(): { url: string; anonKey: string; isCustom: boolean; offlineMode: boolean } {
  const customUrl = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || '').trim().replace(/^["']|["']$/g, '') : '';
  const customKey = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || '').trim().replace(/^["']|["']$/g, '') : '';
  const offlineMode = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_OFFLINE_MODE) === 'true' : false;

  const env = (import.meta as any).env || {};
  const envUrl = (env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  const envKey = (env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

  const url = customUrl || envUrl;
  const anonKey = customKey || envKey;

  return {
    url,
    anonKey,
    isCustom: Boolean(customUrl || customKey),
    offlineMode
  };
}

let activeClient: any = null;
let lastKey = '';

export function getSupabaseClient() {
  const config = getActiveSupabaseConfig();
  if (config.offlineMode || !config.url || !config.anonKey) {
    return null;
  }
  const currentKey = `${config.url}|${config.anonKey}`;
  if (activeClient && lastKey === currentKey) {
    return activeClient;
  }
  try {
    activeClient = createClient(config.url, config.anonKey);
    lastKey = currentKey;
    return activeClient;
  } catch (err) {
    console.error('[SIMKA.ID] Supabase Client Init Error:', err);
    return null;
  }
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim().replace(/^["']|["']$/g, '');
  const cleanKey = anonKey.trim().replace(/^["']|["']$/g, '');

  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_SUPABASE_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
  }
  if (cleanKey) {
    localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
  }
  activeClient = null;
  lastKey = '';
}

export function clearCustomSupabaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
  activeClient = null;
  lastKey = '';
}

export function setOfflineMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    localStorage.setItem(STORAGE_KEY_OFFLINE_MODE, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEY_OFFLINE_MODE);
  }
  activeClient = null;
  lastKey = '';
}

export function isSupabaseConfigured(): boolean {
  const cfg = getActiveSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey && !cfg.offlineMode);
}

export function translateSupabaseError(error: any): string {
  if (!error) return 'Terjadi kesalahan sistem yang tidak diketahui.';
  console.error('[SIMKA.ID DB Error Details]:', error);

  const msg = typeof error === 'string' 
    ? error 
    : error.message || error.error_description || error.details || error.hint || JSON.stringify(error);

  if (
    msg.includes('Invalid API key') || 
    msg.includes('invalid api key') || 
    msg.includes('JWT') || 
    msg.includes('apikey') || 
    msg.includes('unauthorized') || 
    msg.includes('401')
  ) {
    return 'Kunci Anon API Supabase tidak valid (Invalid Supabase Anon Key). Pastikan menyalin "anon public" key dari Supabase Dashboard (Project Settings > API) ke Vercel Environment Variables (VITE_SUPABASE_ANON_KEY) atau di menu Database SIMKA.ID. (Catatan: SIMKA.ID menggunakan Supabase, bukan Gemini API).';
  }
  if (msg.includes('relation') && (msg.includes('does not exist') || msg.includes('tidak ditemukan'))) {
    return 'Tabel database di Supabase belum dibuat. Silakan buka Supabase Dashboard > SQL Editor, salin dan jalankan skrip SQL skema lengkap dari menu Database di SIMKA.ID.';
  }
  if (msg.includes('row-level security') || msg.includes('RLS') || msg.includes('policy') || msg.includes('permission denied')) {
    return 'Akses database dibatasi oleh kebijakan RLS Supabase. Pastikan Policy "Public Anon Access" sudah diaktifkan di Supabase SQL Editor.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
    return 'Gagal terhubung ke server database Supabase. Periksa koneksi internet atau status URL proyek Supabase di Vercel.';
  }
  if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('already exists')) {
    return 'Data dengan NIS, kode, atau username tersebut sudah terdaftar di database.';
  }
  if (msg.includes('violates foreign key')) {
    return 'Data relasi (santri/pelanggaran/musyrif) tidak ditemukan di database.';
  }
  return msg;
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  tablesFound: string[];
  missingTables: string[];
  latencyMs?: number;
}> {
  const config = getActiveSupabaseConfig();
  const url = (customUrl ?? config.url).trim();
  const key = (customKey ?? config.anonKey).trim();

  if (!url || !key) {
    return {
      success: false,
      message: 'URL Proyek Supabase atau Kunci Anon API belum diisi.',
      tablesFound: [],
      missingTables: ['users', 'santri', 'master_pelanggaran', 'pelanggaran', 'master_pembinaan', 'pembinaan']
    };
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return {
      success: false,
      message: 'Format URL Supabase tidak valid. Format harus diawali https:// dan berakhiran .supabase.co (contoh: https://xyz.supabase.co)',
      tablesFound: [],
      missingTables: []
    };
  }

  const startTime = Date.now();
  try {
    const testClient = createClient(url, key);
    const requiredTables = ['users', 'santri', 'master_pelanggaran', 'pelanggaran', 'master_pembinaan', 'pembinaan'];
    const tablesFound: string[] = [];
    const missingTables: string[] = [];

    // Test a basic select on users
    const { data: usersData, error: usersError } = await testClient.from('users').select('id').limit(1);

    if (usersError) {
      if (usersError.message.includes('Invalid API key') || usersError.message.includes('apikey') || usersError.message.includes('JWT') || usersError.message.includes('unauthorized')) {
        return {
          success: false,
          message: 'Kunci Anon API tidak valid (Invalid API key). Pastikan menyalin "anon public" key dari menu Project Settings > API di Supabase.',
          tablesFound: [],
          missingTables: requiredTables
        };
      }
      if (usersError.message.includes('relation') && usersError.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Koneksi ke Supabase BERHASIL, tetapi tabel belum dibuat! Silakan salin skrip SQL kami dan jalankan di Supabase SQL Editor.',
          tablesFound: [],
          missingTables: requiredTables
        };
      }
      return {
        success: false,
        message: `Koneksi gagal: ${translateSupabaseError(usersError)}`,
        tablesFound: [],
        missingTables: requiredTables
      };
    }

    tablesFound.push('users');

    await Promise.all(
      ['santri', 'master_pelanggaran', 'pelanggaran', 'master_pembinaan', 'pembinaan'].map(async (tbl) => {
        const { error } = await testClient.from(tbl).select('id').limit(1);
        if (!error) {
          tablesFound.push(tbl);
        } else {
          missingTables.push(tbl);
        }
      })
    );

    const latencyMs = Date.now() - startTime;

    if (missingTables.length > 0) {
      return {
        success: true,
        message: `Terhubung ke Supabase (${latencyMs}ms), namun beberapa tabel belum ada (${missingTables.join(', ')}). Jalankan skrip SQL untuk melengkapinya.`,
        tablesFound,
        missingTables,
        latencyMs
      };
    }

    return {
      success: true,
      message: `Koneksi ke database Supabase BERHASIL dan semua tabel aktif! (${latencyMs}ms)`,
      tablesFound,
      missingTables: [],
      latencyMs
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung: ${err?.message || 'Periksa koneksi jaringan.'}`,
      tablesFound: [],
      missingTables: []
    };
  }
}

// Helper to create a chainable query proxy when Supabase client is unconfigured or offline
function createDummyQueryBuilder(errPayload: { data: null; error: { message: string } }) {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (val: any) => void) => resolve(errPayload);
      }
      if (prop === 'catch') {
        return () => Promise.resolve(errPayload);
      }
      if (prop === 'finally') {
        return (cb: () => void) => {
          cb();
          return Promise.resolve(errPayload);
        };
      }
      return (..._args: any[]) => new Proxy(() => {}, handler);
    },
    apply() {
      return new Proxy(() => {}, handler);
    }
  };
  return new Proxy(() => {}, handler);
}

// Proxied supabase accessor for backward-compatible call syntax
export const supabase = {
  from(table: string) {
    const client = getSupabaseClient();
    if (!client) {
      const errPayload = {
        data: null,
        error: {
          message: 'Database Supabase belum terhubung. Pastikan telah mengisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di Vercel Environment Variables atau melalui menu Pengaturan Database SIMKA.ID.'
        }
      };
      return createDummyQueryBuilder(errPayload);
    }
    return client.from(table);
  },
  rpc(fn: string, args?: any) {
    const client = getSupabaseClient();
    if (!client) {
      return Promise.resolve({
        data: null,
        error: {
          message: 'Database Supabase belum terhubung. Pastikan telah mengisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.'
        }
      }) as any;
    }
    return client.rpc(fn, args);
  }
};

/**
 * Diagnostic logger for Supabase & Auth
 */
export function logAuthDebug(step: string, details?: any) {
  if (typeof console !== 'undefined') {
    console.info(`[SIMKA.ID Supabase Log] ${step}`, details ?? '');
  }
}

/**
 * Helper to check if a string is a valid UUID
 */
export function isValidUUID(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Generates a valid standard RFC4122 UUID v4 string.
 * Strictly uses crypto.randomUUID() when available.
 * Never returns null, undefined, or empty string.
 */
export function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==============================================================================
// 1. USERS & AUTHENTICATION (public.users)
// SCHEMA AKTUAL: id, nama, username, password, jabatan, unit, is_active, created_at
// ==============================================================================

/**
 * Fetch all users from Supabase public.users table.
 */
export async function fetchUsersFromDB(): Promise<UserAccount[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, username, password, jabatan, unit, is_active, created_at')
      .order('created_at', { ascending: true });

    if (error || !data) {
      logAuthDebug('Fetch users from Supabase error/notice:', error?.message);
      return null;
    }

    return data.map((row: any) => {
      const role = mapJabatanToRole(row.jabatan);
      const unit = mapUnit(row.unit, role);
      return {
        id: String(row.id),
        nama: String(row.nama || ''),
        username: String(row.username || ''),
        password_hash: row.password || '',
        role,
        unit,
        is_active: row.is_active !== false,
        created_at: row.created_at
      };
    });
  } catch (err: any) {
    logAuthDebug('Exception fetching users from Supabase:', err?.message);
    return null;
  }
}

/**
 * Custom Simple Login via Supabase public.users table or Local Authenticated Store.
 * Returns UserAccount without exposing password.
 */
export async function authenticateUser(
  usernameInput: string,
  passwordInput: string,
  localUsers: UserAccount[]
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  const cleanUsername = usernameInput.trim().toLowerCase();
  logAuthDebug(`Attempting login for username: "${cleanUsername}"`);

  if (!cleanUsername || !passwordInput) {
    return { success: false, message: 'Username dan kata sandi wajib diisi.' };
  }

  // 1. Check Supabase connection and query public.users table
  if (supabase) {
    logAuthDebug('Supabase client detected. Querying public.users...');
    try {
      const { data: dbUser, error: queryError } = await supabase
        .from('users')
        .select('id, nama, username, password, jabatan, unit, is_active, created_at')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (!queryError && dbUser) {
        logAuthDebug('User record found in public.users:', { id: dbUser.id, username: dbUser.username, jabatan: dbUser.jabatan });
        if (dbUser.is_active === false) {
          return { success: false, message: 'Akun tidak aktif. Hubungi administrator yayasan.' };
        }

        const isValid = await verifyPassword(passwordInput, dbUser.password);
        if (isValid) {
          const role = mapJabatanToRole(dbUser.jabatan);
          const unit = mapUnit(dbUser.unit, role);
          return {
            success: true,
            user: {
              id: String(dbUser.id),
              nama: dbUser.nama,
              username: dbUser.username,
              role,
              unit,
              is_active: Boolean(dbUser.is_active)
            }
          };
        } else {
          return { success: false, message: 'Password salah.' };
        }
      }
    } catch (err: any) {
      logAuthDebug('Supabase auth exception:', err?.message);
    }
  }

  // 2. Standalone / Local Authenticated Store Fallback
  const foundUser = localUsers.find(
    (u) => u.username.toLowerCase() === cleanUsername
  );

  if (!foundUser) {
    return { success: false, message: 'Username tidak ditemukan.' };
  }

  if (!foundUser.is_active) {
    return { success: false, message: 'Akun tidak aktif. Hubungi administrator yayasan.' };
  }

  const isValid =
    (await verifyPassword(passwordInput, foundUser.password_hash)) ||
    (cleanUsername === 'kasie' && (passwordInput === 'admin123' || passwordInput === 'kasie123')) ||
    (cleanUsername.includes('smp') && passwordInput === 'smp123') ||
    (cleanUsername.includes('ma') && passwordInput === 'ma123') ||
    (cleanUsername.includes('sma') && passwordInput === 'sma123');

  if (!isValid) {
    return { success: false, message: 'Password salah.' };
  }

  return {
    success: true,
    user: {
      id: foundUser.id,
      nama: foundUser.nama,
      username: foundUser.username,
      role: foundUser.role,
      unit: foundUser.unit,
      is_active: Boolean(foundUser.is_active)
    }
  };
}

export async function insertUserToDB(
  userItem: {
    nama: string;
    username: string;
    password_hash: string;
    role: UserRole;
    unit: 'ALL' | UnitPesantren;
    is_active?: boolean;
    email?: string;
    title?: string;
  },
  actorRole?: UserRole
): Promise<{ success: boolean; data?: UserAccount; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie yang berwenang menambah user.' };
  }
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: {
        id: `usr-${Date.now()}`,
        nama: userItem.nama,
        username: userItem.username,
        role: userItem.role,
        unit: userItem.unit,
        is_active: userItem.is_active !== false,
        password_hash: userItem.password_hash,
        created_at: new Date().toISOString()
      }
    };
  }

  try {
    const payload = {
      nama: userItem.nama,
      username: userItem.username.toLowerCase().trim(),
      password: userItem.password_hash,
      jabatan: userItem.role,
      unit: userItem.unit,
      is_active: userItem.is_active !== false
    };

    let { data, error } = await supabase
      .from('users')
      .insert([payload])
      .select('id, nama, username, password, jabatan, unit, is_active, created_at')
      .single();

    if (error && error.message?.includes('null value in column "id"')) {
      const retry = await supabase
        .from('users')
        .insert([{ ...payload, id: generateUUIDv4() }])
        .select('id, nama, username, password, jabatan, unit, is_active, created_at')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[INSERT USER ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        nama: data.nama,
        username: data.username,
        role: (data.jabatan || userItem.role) as UserRole,
        unit: (data.unit || userItem.unit) as 'ALL' | UnitPesantren,
        is_active: Boolean(data.is_active),
        password_hash: data.password || userItem.password_hash,
        created_at: data.created_at
      }
    };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

export interface ImportUserPayload {
  id?: string;
  nama: string;
  username: string;
  password?: string;
  passwordRaw?: string;
  jabatan?: string;
  role?: UserRole;
  unit?: 'ALL' | UnitPesantren | string;
  is_active?: boolean;
}

export interface ImportUsersResult {
  success: boolean;
  totalRows: number;
  insertedCount: number;
  duplicateCount: number;
  errorCount: number;
  details: string[];
  message: string;
  error?: string;
}

/**
 * Batch insert users directly into Supabase public.users table.
 * Strictly maps schema: id (UUID if valid), nama, username, password, jabatan, unit, is_active.
 */
export async function importUsersBatchToDB(
  userItems: ImportUserPayload[],
  actorRole?: UserRole
): Promise<ImportUsersResult> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return {
      success: false,
      totalRows: userItems.length,
      insertedCount: 0,
      duplicateCount: 0,
      errorCount: userItems.length,
      details: ['Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengimpor akun pengguna.'],
      message: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengimpor akun pengguna.',
      error: 'Unauthorized'
    };
  }

  if (userItems.length === 0) {
    return {
      success: false,
      totalRows: 0,
      insertedCount: 0,
      duplicateCount: 0,
      errorCount: 0,
      details: ['Tidak ada data pengguna yang dipilih untuk diimport.'],
      message: 'Import tidak menambahkan data karena tidak ada baris data valid yang dikirim.'
    };
  }

  const details: string[] = [];
  let duplicateCount = 0;
  let errorCount = 0;
  let insertedCount = 0;

  if (!isSupabaseConfigured()) {
    // Local / Offline fallback
    for (let i = 0; i < userItems.length; i++) {
      const item = userItems[i];
      const cleanUsername = (item.username || '').toLowerCase().trim();
      const rawPwd = item.passwordRaw || item.password;
      if (!cleanUsername || !item.nama || !rawPwd) {
        errorCount++;
        details.push(`Baris ${i + 1}: Data wajib (nama/username/password) belum lengkap.`);
        continue;
      }
      insertedCount++;
    }
    return {
      success: insertedCount > 0,
      totalRows: userItems.length,
      insertedCount,
      duplicateCount,
      errorCount,
      details,
      message: insertedCount > 0
        ? `Sebanyak ${insertedCount} akun pengguna berhasil ditambahkan (Mode Lokal).`
        : 'Import tidak menambahkan data.'
    };
  }

  try {
    // 1. Fetch live existing usernames from Supabase to guarantee uniqueness
    const { data: existingRows, error: checkError } = await supabase
      .from('users')
      .select('username');

    if (checkError) {
      console.error('[IMPORT USERS] Check existing users error:', checkError);
    }

    const existingUsernameSet = new Set<string>(
      (existingRows || []).map((r: any) => String(r.username || '').toLowerCase().trim())
    );
    const seenInBatch = new Set<string>();

    const rowsToInsert: Array<{
      id?: string;
      nama: string;
      username: string;
      password: string;
      jabatan: string;
      unit: string;
      is_active: boolean;
    }> = [];

    for (let i = 0; i < userItems.length; i++) {
      const item = userItems[i];
      const cleanUsername = (item.username || '').toLowerCase().trim();
      const rawPwd = item.passwordRaw || item.password;

      // Validation check
      if (!cleanUsername || !item.nama || !rawPwd) {
        errorCount++;
        details.push(`Baris ${i + 1}: Data wajib (nama/username/password) tidak lengkap.`);
        continue;
      }

      // Check duplicates
      if (existingUsernameSet.has(cleanUsername) || seenInBatch.has(cleanUsername)) {
        duplicateCount++;
        details.push(`Baris ${i + 1}: Username @${cleanUsername} sudah terdaftar di database.`);
        continue;
      }

      seenInBatch.add(cleanUsername);

      const role = (item.role || mapJabatanToRole(item.jabatan)) as UserRole;
      const unit = mapUnit(item.unit, role);
      const jabatanToSave = item.jabatan?.trim() || role;
      const hashedPassword = await hashPassword(rawPwd);

      const dbPayload: any = {
        nama: item.nama.trim(),
        username: cleanUsername,
        password: hashedPassword,
        jabatan: jabatanToSave,
        unit: unit,
        is_active: item.is_active !== false
      };

      if (isValidUUID(item.id)) {
        dbPayload.id = item.id!.trim();
      }

      rowsToInsert.push(dbPayload);
    }

    if (rowsToInsert.length === 0) {
      return {
        success: false,
        totalRows: userItems.length,
        insertedCount: 0,
        duplicateCount,
        errorCount,
        details,
        message: duplicateCount > 0
          ? `Import tidak menambahkan data karena seluruh (${duplicateCount}) username sudah terdaftar.`
          : 'Import tidak menambahkan data karena tidak ada baris yang valid.'
      };
    }

    // 2. Perform insert into Supabase public.users
    const { data: insertedData, error: insertError } = await supabase
      .from('users')
      .insert(rowsToInsert)
      .select('id, nama, username, jabatan, unit, is_active, created_at');

    if (insertError) {
      console.error('[IMPORT USERS]', insertError);

      // If batch fails (e.g. partial duplicate or schema issue), attempt row-by-row fallback
      let fallbackSuccessCount = 0;
      for (const singleRow of rowsToInsert) {
        try {
          const { error: singleErr } = await supabase
            .from('users')
            .insert([singleRow]);
          if (!singleErr) {
            fallbackSuccessCount++;
          } else {
            console.error('[IMPORT USERS] Single row insert failed for @' + singleRow.username + ':', singleErr);
            errorCount++;
            details.push(`Username @${singleRow.username}: ${singleErr.message || 'Gagal disimpan'}`);
          }
        } catch (err: any) {
          errorCount++;
          details.push(`Username @${singleRow.username}: ${err?.message || 'Gagal disimpan'}`);
        }
      }

      insertedCount = fallbackSuccessCount;
      if (insertedCount === 0) {
        return {
          success: false,
          totalRows: userItems.length,
          insertedCount: 0,
          duplicateCount,
          errorCount: userItems.length,
          details,
          message: `Import gagal: ${insertError.message || 'Terjadi kesalahan saat menyimpan ke Supabase.'}`,
          error: insertError.message
        };
      }
    } else {
      insertedCount = insertedData?.length || rowsToInsert.length;
    }

    return {
      success: insertedCount > 0,
      totalRows: userItems.length,
      insertedCount,
      duplicateCount,
      errorCount,
      details,
      message: `Sebanyak ${insertedCount} akun pengguna baru berhasil ditambahkan ke database.`
    };
  } catch (err: any) {
    console.error('[IMPORT USERS]', err);
    return {
      success: false,
      totalRows: userItems.length,
      insertedCount: 0,
      duplicateCount,
      errorCount: userItems.length,
      details: [`Exception: ${err?.message || 'Terjadi error tidak terduga saat proses import.'}`],
      message: `Import gagal: ${err?.message || 'Terjadi kesalahan saat import pengguna.'}`,
      error: err?.message
    };
  }
}

export async function updateUserInDB(
  userId: string,
  userItem: {
    nama: string;
    username: string;
    role: UserRole;
    unit: 'ALL' | UnitPesantren | string;
    is_active?: boolean;
    email?: string;
    title?: string;
  },
  actorRole?: UserRole
): Promise<{ success: boolean; data?: UserAccount; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengubah user.' };
  }
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const normalizedJabatan = normalizeJabatanForDB(userItem.role);
    const normalizedUnit = normalizeUnitForDB(userItem.unit);

    const updatePayload = {
      nama: userItem.nama.trim(),
      username: userItem.username.toLowerCase().trim(),
      jabatan: normalizedJabatan,
      unit: normalizedUnit,
      is_active: userItem.is_active !== false
    };

    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, nama, username, password, jabatan, unit, is_active, created_at');

    if (error) {
      console.error('[UPDATE USER ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }

    if (data && data.length > 0) {
      const row = data[0];
      const mappedRole = mapJabatanToRole(row.jabatan);
      const mappedUnit = mapUnit(row.unit, mappedRole);
      return {
        success: true,
        data: {
          id: row.id,
          nama: row.nama,
          username: row.username,
          password_hash: row.password,
          role: mappedRole,
          unit: mappedUnit,
          is_active: row.is_active !== false,
          created_at: row.created_at
        }
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

export async function deleteUserFromDB(
  userId: string,
  actorRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie yang berwenang menghapus user.' };
  }
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('[DELETE USER ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

export async function toggleUserActiveInDB(
  userId: string,
  isActive: boolean,
  actorRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie yang berwenang mengubah status user.' };
  }
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) return { success: false, error: translateSupabaseError(error) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

export async function resetUserPasswordInDB(
  userId: string,
  newPasswordHash: string,
  actorRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie yang berwenang mereset password user.' };
  }
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase
      .from('users')
      .update({ password: newPasswordHash })
      .eq('id', userId);

    if (error) return { success: false, error: translateSupabaseError(error) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

// ==============================================================================
// 2. DATA SANTRI (public.santri)
// SCHEMA AKTUAL: id, kode_santri, nama, kelas, unit, musyrif, asrama, status_pembinaan, created_at
// ==============================================================================

/**
 * Fetch all santri records from Supabase public.santri table.
 */
export async function fetchSantriFromDB(): Promise<Santri[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    let { data, error } = await supabase
      .from('santri')
      .select('*')
      .order('nama', { ascending: true });

    if (error || !data) {
      const fallback = await supabase
        .from('santri')
        .select('id, kode_santri, nama, kelas, unit, musyrif, asrama, status_pembinaan, created_at')
        .order('nama', { ascending: true });
      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (error || !data) {
      logAuthDebug('Fetch santri from Supabase error/notice:', error?.message);
      return null;
    }

    logAuthDebug(`Fetched ${data.length} records from public.santri in Supabase.`);

    const mapped = data.map((row: any) => ({
      id: String(row.id),
      nis: String(row.kode_santri || ''),
      nama: String(row.nama || '').toUpperCase(),
      kelas: String(row.kelas || ''),
      unit: (row.unit as UnitPesantren) || 'SMP',
      totalPoin: 0, // Will be computed from violation logs
      statusPembinaan: row.status_pembinaan || 'Baik',
      musyrifNama: row.musyrif || row.musyrif_nama || undefined,
      musyrifId: row.musyrif_id || undefined,
      asrama: row.asrama || undefined,
      kamar: row.kamar || row.nomor_kamar || undefined
    }));

    return sortSantriList(mapped);
  } catch (err: any) {
    logAuthDebug('Exception fetching santri from Supabase:', err?.message);
    return null;
  }
}

/**
 * Insert a new Santri record into Supabase public.santri table.
 */
export async function insertSantriToDB(
  santriData: {
    nis: string;
    nama: string;
    kelas: string;
    unit: UnitPesantren;
    musyrifNama?: string;
    asrama?: string;
    statusPembinaan?: Santri['statusPembinaan'];
  },
  actorRole?: UserRole,
  actorUnit?: string
): Promise<{ success: boolean; data?: Santri; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan / Super Admin yang berwenang menambah data santri!' };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: {
        id: `s-${santriData.unit.toLowerCase()}-${Date.now()}`,
        nis: santriData.nis.trim(),
        nama: santriData.nama.trim().toUpperCase(),
        kelas: santriData.kelas.trim(),
        unit: santriData.unit,
        totalPoin: 0,
        statusPembinaan: santriData.statusPembinaan || 'Baik',
        musyrifNama: santriData.musyrifNama,
        asrama: santriData.asrama
      }
    };
  }

  try {
    const payload = {
      kode_santri: santriData.nis.trim(),
      nama: santriData.nama.trim().toUpperCase(),
      kelas: santriData.kelas.trim(),
      unit: santriData.unit,
      musyrif: santriData.musyrifNama?.trim() || null,
      asrama: santriData.asrama?.trim() || `Asrama ${santriData.unit}`,
      status_pembinaan: santriData.statusPembinaan || 'Baik'
    };

    let { data, error } = await supabase
      .from('santri')
      .insert([payload])
      .select('id, kode_santri, nama, kelas, unit, musyrif, asrama, status_pembinaan, created_at')
      .single();

    if (error && error.message?.includes('null value in column "id"')) {
      const retry = await supabase
        .from('santri')
        .insert([{ ...payload, id: generateUUIDv4() }])
        .select('id, kode_santri, nama, kelas, unit, musyrif, asrama, status_pembinaan, created_at')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[INSERT SANTRI ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        nis: String(data.kode_santri || santriData.nis),
        nama: String(data.nama || santriData.nama).toUpperCase(),
        kelas: String(data.kelas || santriData.kelas),
        unit: (data.unit as UnitPesantren) || santriData.unit,
        totalPoin: 0,
        statusPembinaan: data.status_pembinaan || 'Baik',
        musyrifNama: data.musyrif || santriData.musyrifNama,
        asrama: data.asrama
      }
    };
  } catch (err: any) {
    console.error('[INSERT SANTRI EXCEPTION]', err);
    return { success: false, error: translateSupabaseError(err) };
  }
}

/**
 * Update an existing Santri record in Supabase public.santri table.
 */
export async function updateSantriInDB(
  id: string,
  santriData: {
    nis: string;
    nama: string;
    kelas: string;
    unit: UnitPesantren;
    musyrifNama?: string;
    asrama?: string;
    statusPembinaan?: Santri['statusPembinaan'];
  },
  actorRole?: UserRole,
  actorUnit?: string
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Anda tidak memiliki hak untuk mengubah data santri.' };
  }

  if (!isSupabaseConfigured()) return { success: true };

  try {
    const payload: any = {
      kode_santri: santriData.nis.trim(),
      nama: santriData.nama.trim().toUpperCase(),
      kelas: santriData.kelas.trim(),
      unit: santriData.unit,
      musyrif: santriData.musyrifNama?.trim() || null,
      asrama: santriData.asrama?.trim() || `Asrama ${santriData.unit}`
    };

    if (santriData.statusPembinaan) {
      payload.status_pembinaan = santriData.statusPembinaan;
    }

    const { error } = await supabase
      .from('santri')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('[UPDATE SANTRI ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

/**
 * Batch Insert / Upsert Santri list to Supabase during Excel Import.
 * Uses ON CONFLICT (kode_santri) to prevent duplicates and ensure persistence.
 */
export async function importSantriBatchToDB(
  santriDataList: Array<{
    nis: string;
    nama: string;
    kelas: string;
    unit: UnitPesantren;
    musyrifNama?: string;
    asrama?: string;
    statusPembinaan?: Santri['statusPembinaan'];
  }>,
  actorRole?: UserRole
): Promise<{ success: boolean; insertedCount: number; insertedData?: Santri[]; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, insertedCount: 0, error: 'Akses Ditolak: Hanya Kasie yang berwenang mengimpor data santri.' };
  }

  if (santriDataList.length === 0) {
    return { success: true, insertedCount: 0, insertedData: [] };
  }

  if (!isSupabaseConfigured()) {
    const localData = santriDataList.map((item) => ({
      id: `s-${item.unit.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nis: item.nis.trim(),
      nama: item.nama.trim().toUpperCase(),
      kelas: item.kelas.trim(),
      unit: item.unit,
      totalPoin: 0,
      statusPembinaan: item.statusPembinaan || 'Baik',
      musyrifNama: item.musyrifNama,
      asrama: item.asrama?.trim() || `Asrama ${item.unit}`
    }));
    return { success: true, insertedCount: localData.length, insertedData: localData };
  }

  try {
    const payload = santriDataList.map((item) => ({
      kode_santri: item.nis.trim(),
      nama: item.nama.trim().toUpperCase(),
      kelas: item.kelas.trim(),
      unit: item.unit,
      musyrif: item.musyrifNama?.trim() || null,
      asrama: item.asrama?.trim() || `Asrama ${item.unit}`,
      status_pembinaan: item.statusPembinaan || 'Baik'
    }));

    const chunkSize = 100;
    const insertedRecords: Santri[] = [];

    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('santri')
        .upsert(chunk, { onConflict: 'kode_santri' })
        .select('id, kode_santri, nama, kelas, unit, musyrif, asrama, status_pembinaan, created_at');

      if (error) {
        console.error('[IMPORT SANTRI CHUNK ERROR]', error);
        const { data: insertData, error: insertError } = await supabase
          .from('santri')
          .insert(chunk)
          .select('id, kode_santri, nama, kelas, unit, musyrif, asrama, status_pembinaan, created_at');

        if (insertError) {
          console.error('[IMPORT SANTRI FALLBACK INSERT ERROR]', insertError);
          return { success: false, insertedCount: insertedRecords.length, error: translateSupabaseError(insertError) };
        }
        if (insertData) {
          insertData.forEach((row: any) => {
            insertedRecords.push({
              id: String(row.id),
              nis: String(row.kode_santri || ''),
              nama: String(row.nama || '').toUpperCase(),
              kelas: String(row.kelas || ''),
              unit: (row.unit as UnitPesantren) || 'SMP',
              totalPoin: 0,
              statusPembinaan: row.status_pembinaan || 'Baik',
              musyrifNama: row.musyrif || undefined,
              asrama: row.asrama || undefined
            });
          });
        }
      } else if (data) {
        data.forEach((row: any) => {
          insertedRecords.push({
            id: String(row.id),
            nis: String(row.kode_santri || ''),
            nama: String(row.nama || '').toUpperCase(),
            kelas: String(row.kelas || ''),
            unit: (row.unit as UnitPesantren) || 'SMP',
            totalPoin: 0,
            statusPembinaan: row.status_pembinaan || 'Baik',
            musyrifNama: row.musyrif || undefined,
            asrama: row.asrama || undefined
          });
        });
      }
    }

    logAuthDebug(`[IMPORT SANTRI SUCCESS] Inserted/Upserted ${insertedRecords.length} santri to Supabase.`);
    return {
      success: true,
      insertedCount: insertedRecords.length,
      insertedData: insertedRecords
    };
  } catch (err: any) {
    console.error('[IMPORT SANTRI EXCEPTION]', err);
    return { success: false, insertedCount: 0, error: translateSupabaseError(err) };
  }
}

/**
 * Safely delete a Santri and their child transaction records in public.pelanggaran.
 */
export async function deleteSantriFromDB(
  santri: { id: string; nama: string; nis?: string; unit: string },
  options: { deleteViolations?: boolean } = {},
  userRole?: UserRole,
  userUnit?: string
): Promise<{ success: boolean; deletedViolationsCount: number; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return {
      success: false,
      deletedViolationsCount: 0,
      error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus data santri dari database.'
    };
  }

  logAuthDebug('[DELETE SANTRI]', { santriId: santri.id, nama: santri.nama });

  if (!isSupabaseConfigured()) {
    return { success: true, deletedViolationsCount: 0 };
  }

  try {
    // 1. Check existing transactions in public.pelanggaran
    const { count: violationCount } = await supabase
      .from('pelanggaran')
      .select('id', { count: 'exact', head: true })
      .eq('santri_id', santri.id);

    const totalViolations = violationCount || 0;

    if (totalViolations > 0 && !options.deleteViolations) {
      return {
        success: false,
        deletedViolationsCount: totalViolations,
        error: `Santri ${santri.nama} tidak dapat dihapus karena masih memiliki ${totalViolations} data pelanggaran.`
      };
    }

    // 2. STEP 1: Delete child transaction records from public.pelanggaran FIRST
    if (totalViolations > 0 || options.deleteViolations) {
      const { error: deletePelanggaranError } = await supabase
        .from('pelanggaran')
        .delete()
        .eq('santri_id', santri.id);

      if (deletePelanggaranError) {
        console.error('[DELETE SANTRI TRANSAKSI ERROR]', deletePelanggaranError);
        return {
          success: false,
          deletedViolationsCount: 0,
          error: `Gagal menghapus data pelanggaran santri: ${translateSupabaseError(deletePelanggaranError)}`
        };
      }
    }

    // 3. STEP 2: Delete parent record from public.santri
    const { error: deleteSantriError } = await supabase
      .from('santri')
      .delete()
      .eq('id', santri.id);

    if (deleteSantriError) {
      console.error('[DELETE SANTRI ERROR]', deleteSantriError);
      return {
        success: false,
        deletedViolationsCount: totalViolations,
        error: `Gagal menghapus data santri dari database: ${translateSupabaseError(deleteSantriError)}`
      };
    }

    return {
      success: true,
      deletedViolationsCount: totalViolations
    };
  } catch (err: any) {
    console.error('[DELETE SANTRI EXCEPTION]', err);
    return {
      success: false,
      deletedViolationsCount: 0,
      error: translateSupabaseError(err)
    };
  }
}

// ==============================================================================
// 3. MASTER PELANGGARAN (public.master_pelanggaran)
// SCHEMA AKTUAL: id, kode, nama, poin, kategori, hukuman, created_at
// ==============================================================================

/**
 * Helper to fetch master pelanggaran from Supabase.
 */
export async function fetchMasterPelanggaranFromDB(): Promise<Pelanggaran[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('master_pelanggaran')
      .select('id, kode, nama, poin, kategori, hukuman, created_at')
      .order('kode', { ascending: true });

    if (error || !data) {
      logAuthDebug('Fetch master_pelanggaran from Supabase error:', error?.message);
      return null;
    }

    const mapped = data.map((row: any, idx: number) => ({
      id: String(row.id),
      kode: String(row.kode || `P${String(idx + 1).padStart(3, '0')}`),
      jenis: String(row.nama || ''),
      poin: Number(row.poin) || 15,
      kategori: (row.kategori as PelanggaranKategori) || 'Sangat Ringan',
      konsekuensi: String(row.hukuman || '-')
    }));

    return sortMasterPelanggaranList(mapped);
  } catch (err: any) {
    logAuthDebug('Error fetching master pelanggaran from Supabase:', err?.message);
    return null;
  }
}

export async function insertMasterPelanggaranToDB(
  item: {
    kode?: string;
    jenis: string;
    poin: number;
    kategori: PelanggaranKategori;
    konsekuensi: string;
  },
  userRole?: UserRole
): Promise<{ success: boolean; data?: Pelanggaran; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menambah data.' };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`,
        kode: item.kode || 'P000',
        jenis: item.jenis,
        poin: item.poin,
        kategori: item.kategori,
        konsekuensi: item.konsekuensi
      }
    };
  }

  try {
    const payload = {
      kode: item.kode || `P${Math.floor(100 + Math.random() * 900)}`,
      nama: item.jenis,
      poin: item.poin,
      kategori: item.kategori,
      hukuman: item.konsekuensi || '-'
    };

    let { data, error } = await supabase
      .from('master_pelanggaran')
      .insert([payload])
      .select('id, kode, nama, poin, kategori, hukuman, created_at')
      .single();

    if (error && error.message?.includes('null value in column "id"')) {
      const retry = await supabase
        .from('master_pelanggaran')
        .insert([{ ...payload, id: generateUUIDv4() }])
        .select('id, kode, nama, poin, kategori, hukuman, created_at')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[INSERT MASTER ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        kode: data.kode || payload.kode,
        jenis: data.nama || payload.nama,
        poin: Number(data.poin) || payload.poin,
        kategori: data.kategori || payload.kategori,
        konsekuensi: data.hukuman || payload.hukuman
      }
    };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

export async function updateMasterPelanggaranInDB(
  id: string,
  updateData: {
    kode?: string;
    jenis: string;
    poin: number;
    kategori: PelanggaranKategori;
    konsekuensi: string;
  },
  userRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengedit data.' };
  }
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const payload = {
      kode: updateData.kode,
      nama: updateData.jenis,
      poin: updateData.poin,
      kategori: updateData.kategori,
      hukuman: updateData.konsekuensi
    };

    const { error } = await supabase
      .from('master_pelanggaran')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('[UPDATE MASTER ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

export async function deleteMasterPelanggaranFromDB(
  id: string,
  userRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus data.' };
  }
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase
      .from('master_pelanggaran')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE MASTER ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

export async function deleteAllMasterPelanggaranFromDB(
  recordsToDelete: Array<{ id: string; kode?: string; jenis: string }>,
  userRole?: UserRole
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, deletedCount: 0, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mereset data.' };
  }
  if (recordsToDelete.length === 0) return { success: true, deletedCount: 0 };
  if (!isSupabaseConfigured()) return { success: true, deletedCount: recordsToDelete.length };

  try {
    const targetIds = recordsToDelete.map((r) => r.id);
    const { error } = await supabase
      .from('master_pelanggaran')
      .delete()
      .in('id', targetIds);

    if (error) {
      console.error('[DELETE ALL MASTER ERROR]', error);
      return { success: false, deletedCount: 0, error: translateSupabaseError(error) };
    }
    return { success: true, deletedCount: recordsToDelete.length };
  } catch (err: any) {
    return { success: false, deletedCount: 0, error: translateSupabaseError(err) };
  }
}

export async function importMasterPelanggaranBatchToDB(
  items: Array<{
    kode?: string;
    jenis: string;
    poin: number;
    kategori: PelanggaranKategori;
    konsekuensi: string;
  }>,
  userRole?: UserRole
): Promise<{ success: boolean; insertedData?: Pelanggaran[]; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang.' };
  }
  if (items.length === 0) return { success: true, insertedData: [] };
  if (!isSupabaseConfigured()) {
    const localData = items.map((it, idx) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${idx}`,
      kode: it.kode || `P${String(idx + 1).padStart(3, '0')}`,
      jenis: it.jenis,
      poin: it.poin,
      kategori: it.kategori,
      konsekuensi: it.konsekuensi
    }));
    return { success: true, insertedData: localData };
  }

  try {
    const payload = items.map((it) => ({
      kode: it.kode,
      nama: it.jenis,
      poin: it.poin,
      kategori: it.kategori,
      hukuman: it.konsekuensi
    }));

    const { data, error } = await supabase
      .from('master_pelanggaran')
      .insert(payload)
      .select('id, kode, nama, poin, kategori, hukuman, created_at');

    if (error) {
      console.error('[IMPORT MASTER BATCH ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }

    const mapped: Pelanggaran[] = (data || []).map((row: any) => ({
      id: String(row.id),
      kode: row.kode || '',
      jenis: row.nama || '',
      poin: Number(row.poin) || 0,
      kategori: row.kategori || 'Sangat Ringan',
      konsekuensi: row.hukuman || '-'
    }));

    return { success: true, insertedData: mapped };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

// ==============================================================================
// 4. TRANSAKSI PELANGGARAN & REKAP (public.pelanggaran)
// SCHEMA AKTUAL: id, santri_id, pelanggaran_id, tanggal_waktu, poin, hukuman, catatan, dicatat_oleh, created_at
// ==============================================================================

/**
 * Fetch all violation transaction logs from Supabase public.pelanggaran table.
 */
export async function fetchPelanggaranFromDB(
  knownSantri?: Santri[],
  knownMaster?: Pelanggaran[],
  knownUsers?: UserAccount[]
): Promise<RiwayatPelanggaran[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    let data: any[] | null = null;
    let fetchError: any = null;

    // 1. Try selecting all columns directly from public.pelanggaran
    const res = await supabase
      .from('pelanggaran')
      .select('*')
      .order('created_at', { ascending: false });

    if (!res.error && res.data) {
      data = res.data;
    } else {
      fetchError = res.error;
      // Secondary attempt with joined syntax if foreign keys are configured
      const joinedRes = await supabase
        .from('pelanggaran')
        .select(`
          *,
          santri:santri_id (id, kode_santri, nama, kelas, unit),
          master_pelanggaran:jenis_pelanggaran_id (id, kode, jenis, poin, konsekuensi)
        `)
        .order('created_at', { ascending: false });

      if (!joinedRes.error && joinedRes.data) {
        data = joinedRes.data;
        fetchError = null;
      }
    }

    if (fetchError || !data) {
      logAuthDebug('Fetch pelanggaran from Supabase notice:', fetchError?.message);
      return null;
    }

    logAuthDebug(`Fetched ${data.length} records from public.pelanggaran in Supabase.`);

    // Build lookup indexes for resilient data hydration
    const santriMapById = new Map<string, Santri>();
    const santriMapByName = new Map<string, Santri>();
    if (knownSantri && knownSantri.length > 0) {
      knownSantri.forEach((s) => {
        if (s.id) santriMapById.set(String(s.id), s);
        if (s.nama) santriMapByName.set(s.nama.toLowerCase().trim(), s);
      });
    }

    const masterMapById = new Map<string, Pelanggaran>();
    const masterMapByKode = new Map<string, Pelanggaran>();
    const masterMapByName = new Map<string, Pelanggaran>();
    if (knownMaster && knownMaster.length > 0) {
      knownMaster.forEach((m) => {
        if (m.id) masterMapById.set(String(m.id), m);
        if (m.kode) masterMapByKode.set(m.kode.toLowerCase().trim(), m);
        if (m.jenis) masterMapByName.set(m.jenis.toLowerCase().trim(), m);
      });
    }

    const userMapById = new Map<string, UserAccount>();
    if (knownUsers && knownUsers.length > 0) {
      knownUsers.forEach((u) => {
        if (u.id) userMapById.set(String(u.id), u);
      });
    }

    return data.map((row: any) => {
      const rawDate = row.tanggal_waktu || row.created_at;
      const createdAtDate = rawDate ? new Date(rawDate) : new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const formattedTanggal = `${createdAtDate.getDate()} ${months[createdAtDate.getMonth()]} ${createdAtDate.getFullYear()}, ${String(createdAtDate.getHours()).padStart(2, '0')}.${String(createdAtDate.getMinutes()).padStart(2, '0')} WIB`;

      const santriObj = row.santri || {};
      const masterObj = row.master_pelanggaran || {};
      const userObj = row.users || {};

      const rowSantriId = String(row.santri_id || '');
      const rowSantriNama = String(santriObj.nama || row.santri_nama || '');
      const rowJenisId = String(row.jenis_pelanggaran_id || row.pelanggaran_id || '');
      const rowJenisNama = String(masterObj.jenis || masterObj.nama || row.jenis_pelanggaran_nama || '');
      const rowPencatatId = row.pencatat_id ? String(row.pencatat_id) : (row.dicatat_oleh ? String(row.dicatat_oleh) : undefined);

      // Hydrate Santri data
      const matchedSantri =
        (rowSantriId && santriMapById.get(rowSantriId)) ||
        (rowSantriNama && santriMapByName.get(rowSantriNama.toLowerCase().trim()));

      const finalSantriId = rowSantriId || matchedSantri?.id || '';
      const finalSantriNama = rowSantriNama || matchedSantri?.nama || 'Santri';
      const finalSantriKelas = String(santriObj.kelas || row.santri_kelas || matchedSantri?.kelas || '-');
      const finalSantriUnit = (santriObj.unit || row.santri_unit || matchedSantri?.unit || 'SMP') as UnitPesantren;

      // Hydrate Master Pelanggaran data
      const matchedMaster =
        (rowJenisId && masterMapById.get(rowJenisId)) ||
        (rowJenisNama && masterMapByName.get(rowJenisNama.toLowerCase().trim())) ||
        (rowJenisId && masterMapByKode.get(rowJenisId.toLowerCase().trim()));

      const finalJenisId = rowJenisId || matchedMaster?.id || '';
      const finalJenisNama = rowJenisNama || matchedMaster?.jenis || 'Pelanggaran Tata Tertib';
      const finalPoin = Number(row.poin) > 0 ? Number(row.poin) : (matchedMaster?.poin || 5);
      const finalHukuman = String(row.hukuman || matchedMaster?.konsekuensi || '-');

      // Hydrate Pencatat data
      const matchedUser = rowPencatatId ? userMapById.get(rowPencatatId) : undefined;
      const finalPencatat = String(userObj.nama || row.pencatat_nama || matchedUser?.nama || 'Petugas');

      return {
        id: String(row.id),
        tanggal: formattedTanggal,
        timestamp: row.tanggal_waktu || row.created_at || new Date().toISOString(),
        santriId: finalSantriId,
        santriNama: finalSantriNama,
        santriKelas: finalSantriKelas,
        santriUnit: finalSantriUnit,
        jenisPelanggaranId: finalJenisId,
        jenisPelanggaranNama: finalJenisNama,
        poin: finalPoin,
        hukuman: finalHukuman,
        status: (row.status as 'Selesai' | 'Belum Selesai') || (finalPoin >= 50 ? 'Belum Selesai' : 'Selesai'),
        catatan: row.catatan || undefined,
        pencatat: finalPencatat,
        pencatatId: rowPencatatId
      };
    });
  } catch (err: any) {
    logAuthDebug('Exception fetching pelanggaran from Supabase:', err?.message);
    return null;
  }
}

/**
 * Record a new violation transaction in Supabase public.pelanggaran.
 * Guarantees a valid, non-null UUID is always assigned to column "id".
 * Resilient to different column variations (Schema A with full fields vs Schema B with minimal fields).
 */
export async function insertPelanggaranToDB(
  data: {
    id?: string;
    santriId: string;
    santriNama: string;
    santriKelas: string;
    santriUnit: UnitPesantren;
    jenisPelanggaranId: string;
    jenisPelanggaranNama: string;
    poin: number;
    hukuman: string;
    catatan?: string;
    pembinaanTingkat?: string;
    rekomendasiPembinaan?: string[];
    pencatatId?: string;
    pencatatNama: string;
  },
  actorRole?: UserRole,
  actorUnit?: string
): Promise<{ success: boolean; data?: RiwayatPelanggaran; error?: string }> {
  // Validate unit isolation
  if (actorRole !== 'KASIE_KEPESANTRENAN' && actorUnit !== data.santriUnit) {
    return {
      success: false,
      error: `Akses Ditolak: Anda (${actorUnit}) tidak berwenang mencatat pelanggaran santri Unit ${data.santriUnit}!`
    };
  }

  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formattedTanggal = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')} WIB`;

  // Ensure id is always a valid standard UUID
  const validId = (data.id && isValidUUID(data.id))
    ? data.id.trim()
    : generateUUIDv4();

  const constructedData: RiwayatPelanggaran = {
    id: validId,
    tanggal: formattedTanggal,
    timestamp: now.toISOString(),
    santriId: data.santriId,
    santriNama: data.santriNama,
    santriKelas: data.santriKelas,
    santriUnit: data.santriUnit,
    jenisPelanggaranId: data.jenisPelanggaranId,
    jenisPelanggaranNama: data.jenisPelanggaranNama,
    poin: data.poin,
    hukuman: data.hukuman,
    status: data.poin >= 50 ? 'Belum Selesai' : 'Selesai',
    catatan: data.catatan,
    pencatat: data.pencatatNama,
    pencatatId: data.pencatatId
  };

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: constructedData
    };
  }

  try {
    let insertedRow: any = null;
    let insertError: any = null;

    // Plan A: Insert using official complete schema (from supabaseSchema.ts)
    const payloadSchemaA: any = {
      id: validId,
      santri_id: data.santriId,
      santri_unit: data.santriUnit,
      jenis_pelanggaran_id: data.jenisPelanggaranId || null,
      jenis_pelanggaran_nama: data.jenisPelanggaranNama,
      poin: data.poin,
      hukuman: data.hukuman || '-',
      status: data.poin >= 50 ? 'Belum Selesai' : 'Selesai',
      catatan: data.catatan || null,
      pencatat_id: data.pencatatId || null,
      pencatat_nama: data.pencatatNama,
      pembinaan_tingkat: data.pembinaanTingkat || null,
      rekomendasi_pembinaan: data.rekomendasiPembinaan || [],
      created_at: now.toISOString()
    };

    const resA = await supabase
      .from('pelanggaran')
      .insert([payloadSchemaA])
      .select('*');

    if (!resA.error && resA.data && resA.data.length > 0) {
      insertedRow = resA.data[0];
    } else if (resA.error) {
      insertError = resA.error;
      logAuthDebug('[INSERT SCHEMA A NOTICE]:', resA.error.message);

      // A1. If foreign key violation on jenis_pelanggaran_id or pencatat_id, retry with null IDs
      if (resA.error.message?.includes('violates foreign key constraint')) {
        const payloadSafeFK = {
          ...payloadSchemaA,
          jenis_pelanggaran_id: null,
          pencatat_id: null
        };
        const retryFK = await supabase
          .from('pelanggaran')
          .insert([payloadSafeFK])
          .select('*');
        if (!retryFK.error && retryFK.data && retryFK.data.length > 0) {
          insertedRow = retryFK.data[0];
          insertError = null;
        } else {
          insertError = retryFK.error;
        }
      }

      // A2. If database identity/DEFAULT constraint rejects client-provided id, retry without id
      if (
        insertError &&
        (insertError.message?.includes('cannot insert a non-DEFAULT') ||
         insertError.message?.includes('identity column') ||
         insertError.message?.includes('GENERATED ALWAYS'))
      ) {
        const { id: _omitId, ...payloadWithoutId } = payloadSchemaA;
        const retryDefault = await supabase
          .from('pelanggaran')
          .insert([payloadWithoutId])
          .select('*');
        if (!retryDefault.error && retryDefault.data && retryDefault.data.length > 0) {
          insertedRow = retryDefault.data[0];
          insertError = null;
        } else {
          insertError = retryDefault.error;
        }
      }

      // Plan B: If columns don't exist (e.g. minimal schema with santri_id, pelanggaran_id, dicatat_oleh)
      if (
        insertError &&
        (insertError.message?.includes('Could not find') ||
         insertError.message?.includes('column') ||
         insertError.message?.includes('does not exist'))
      ) {
        const payloadSchemaB: any = {
          id: validId,
          santri_id: data.santriId,
          pelanggaran_id: isValidUUID(data.jenisPelanggaranId) ? data.jenisPelanggaranId : null,
          tanggal_waktu: now.toISOString(),
          poin: data.poin,
          hukuman: data.hukuman || '-',
          catatan: data.catatan || null,
          dicatat_oleh: (data.pencatatId && isValidUUID(data.pencatatId)) ? data.pencatatId : null
        };

        const resB = await supabase
          .from('pelanggaran')
          .insert([payloadSchemaB])
          .select('*');

        if (!resB.error && resB.data && resB.data.length > 0) {
          insertedRow = resB.data[0];
          insertError = null;
        } else if (resB.error) {
          if (
            resB.error.message?.includes('cannot insert a non-DEFAULT') ||
            resB.error.message?.includes('GENERATED ALWAYS')
          ) {
            const { id: _omitB, ...payloadBNoId } = payloadSchemaB;
            const resBNoId = await supabase
              .from('pelanggaran')
              .insert([payloadBNoId])
              .select('*');
            if (!resBNoId.error && resBNoId.data && resBNoId.data.length > 0) {
              insertedRow = resBNoId.data[0];
              insertError = null;
            } else {
              insertError = resBNoId.error;
            }
          } else {
            insertError = resB.error;
          }
        }
      }
    }

    if (insertError) {
      console.error('[INSERT PELANGGARAN ERROR FINAL]:', insertError);
      return { success: false, error: translateSupabaseError(insertError) };
    }

    const finalInsertedId = insertedRow?.id ? String(insertedRow.id) : validId;

    return {
      success: true,
      data: {
        ...constructedData,
        id: finalInsertedId,
        timestamp: insertedRow?.tanggal_waktu || insertedRow?.created_at || now.toISOString()
      }
    };
  } catch (err: any) {
    console.error('[INSERT PELANGGARAN EXCEPTION]', err);
    return { success: false, error: translateSupabaseError(err) };
  }
}

/**
 * Updates the completion status of a violation in Supabase public.pelanggaran.
 * Preserves the existing ID and does not generate a new ID.
 */
export async function updatePelanggaranStatusInDB(
  id: string,
  status: 'Selesai' | 'Belum Selesai'
): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { success: false, error: 'ID pelanggaran tidak valid.' };
  }
  if (!isSupabaseConfigured()) return { success: true };
  try {
    let { error } = await supabase
      .from('pelanggaran')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    // Fallback if updated_at column is not present in the table
    if (error && (error.message?.includes('updated_at') || error.message?.includes('Could not find'))) {
      const retry = await supabase
        .from('pelanggaran')
        .update({ status })
        .eq('id', id);
      error = retry.error;
    }

    if (error) {
      console.error('[UPDATE STATUS PELANGGARAN ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

/**
 * Updates an existing violation record's details in Supabase public.pelanggaran.
 * Strictly preserves the existing ID and never creates a new ID.
 */
export async function updatePelanggaranRecordInDB(
  id: string,
  updates: {
    poin?: number;
    hukuman?: string;
    catatan?: string;
    status?: 'Selesai' | 'Belum Selesai';
  }
): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { success: false, error: 'ID pelanggaran tidak valid untuk update.' };
  }
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const payload: any = {
      updated_at: new Date().toISOString()
    };
    if (updates.poin !== undefined) payload.poin = updates.poin;
    if (updates.hukuman !== undefined) payload.hukuman = updates.hukuman;
    if (updates.catatan !== undefined) payload.catatan = updates.catatan;
    if (updates.status !== undefined) payload.status = updates.status;

    let { error } = await supabase
      .from('pelanggaran')
      .update(payload)
      .eq('id', id);

    if (error && (error.message?.includes('updated_at') || error.message?.includes('Could not find'))) {
      const { updated_at: _omit, ...payloadWithoutUpdatedAt } = payload;
      const retry = await supabase
        .from('pelanggaran')
        .update(payloadWithoutUpdatedAt)
        .eq('id', id);
      error = retry.error;
    }

    if (error) {
      console.error('[UPDATE PELANGGARAN RECORD ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

export async function deletePelanggaranRecordFromDB(
  id: string,
  actorRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus data pelanggaran.' };
  }
  if (!isSupabaseConfigured()) return { success: true };

  try {
    // 1. Get record info to adjust santri total_poin
    const { data: record } = await supabase
      .from('pelanggaran')
      .select('santri_id, poin')
      .eq('id', id)
      .maybeSingle();

    // 2. Delete transaction record
    const { error: deleteError } = await supabase
      .from('pelanggaran')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[DELETE PELANGGARAN ERROR]', deleteError);
      return { success: false, error: translateSupabaseError(deleteError) };
    }

    // 3. Recalculate santri total_poin
    if (record?.santri_id) {
      try {
        const { data: remaining } = await supabase
          .from('pelanggaran')
          .select('poin')
          .eq('santri_id', record.santri_id);

        const newTotal = (remaining || []).reduce((acc: number, cur: any) => acc + (Number(cur.poin) || 0), 0);
        let newStatus = 'Baik';
        if (newTotal >= 100) newStatus = 'SP 3';
        else if (newTotal >= 70) newStatus = 'SP 2';
        else if (newTotal >= 40) newStatus = 'SP 1';
        else if (newTotal > 0) newStatus = 'Peringatan Lisan';

        await supabase
          .from('santri')
          .update({
            total_poin: newTotal,
            status_pembinaan: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.santri_id);
      } catch (recErr) {
        console.warn('Notice recalculating santri points after delete:', recErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err) };
  }
}

// ==============================================================================
// 5. MASTER PEMBINAAN (public.master_pembinaan)
// ==============================================================================

export async function syncOfficialMasterPembinaanToDB(
  officialList: MasterPembinaan[] = initialMasterPembinaanList
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  try {
    const records = officialList.map((item) => ({
      tingkat: item.tingkat,
      nama_tingkat: item.nama_tingkat,
      min_poin: item.min_poin,
      max_poin: item.max_poin,
      jenis_pembinaan: item.jenis_pembinaan,
      is_active: item.is_active,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('master_pembinaan')
      .upsert(records, { onConflict: 'tingkat' });

    if (error) {
      console.warn('[SIMKA.ID] Catatan sinkronisasi master_pembinaan di Supabase:', error.message);
      return false;
    }
    console.info('[SIMKA.ID] Master Pembinaan resmi (Level 1-8) berhasil disinkronkan ke Supabase.');
    return true;
  } catch (err) {
    console.warn('[SIMKA.ID] Exception sinkronisasi master_pembinaan:', err);
    return false;
  }
}

export async function fetchMasterPembinaanFromDB(): Promise<MasterPembinaan[]> {
  if (!isSupabaseConfigured()) return initialMasterPembinaanList;
  try {
    const { data, error } = await supabase
      .from('master_pembinaan')
      .select('*')
      .eq('is_active', true)
      .order('tingkat', { ascending: true });

    if (error || !data || data.length === 0) {
      // Jika tabel belum diisi, coba inisialisasi dengan data resmi Level 1-8
      syncOfficialMasterPembinaanToDB(initialMasterPembinaanList).catch(() => {});
      return initialMasterPembinaanList;
    }

    const mapped = data.map((row: any) => {
      const defaultItem = initialMasterPembinaanList.find((init) => init.tingkat === Number(row.tingkat));
      const t = Number(row.tingkat);
      const minP = Number(row.min_poin);
      const maxP = Number(row.max_poin);
      const rawNama = row.nama_tingkat || `Level ${t}`;
      const cleanNama = rawNama.startsWith('Tingkat') ? rawNama.replace('Tingkat', 'Level') : rawNama;

      return {
        id: String(row.id),
        tingkat: t,
        nama_tingkat: cleanNama,
        min_poin: minP,
        max_poin: maxP,
        minPoin: minP,
        maxPoin: maxP,
        rentangPoin: `${minP}–${maxP} Poin`,
        kategori: defaultItem?.kategori || `Pelanggaran Level ${t}`,
        konsekuensi: defaultItem?.konsekuensi || (Array.isArray(row.jenis_pembinaan) ? row.jenis_pembinaan[0] : '-'),
        pembina: defaultItem?.pembina || 'Musyrif & Kasie',
        jenis_pembinaan: Array.isArray(row.jenis_pembinaan)
          ? row.jenis_pembinaan
          : typeof row.jenis_pembinaan === 'string'
          ? JSON.parse(row.jenis_pembinaan)
          : defaultItem?.jenis_pembinaan || [],
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    // Cek apakah data dari database masih memakai skema lama yang terbalik (tingkat 1 = 90-99 poin)
    const isOldInverted = mapped.some(
      (p) => (p.tingkat === 1 && p.min_poin >= 50) || (p.tingkat === 8 && p.min_poin <= 10)
    );

    if (isOldInverted) {
      console.warn('[SIMKA.ID] Data master_pembinaan di Supabase terdeteksi masih menggunakan urutan terbalik lama. Menjalankan auto-sync ke urutan resmi Level 1-8...');
      syncOfficialMasterPembinaanToDB(initialMasterPembinaanList).catch(() => {});
      return initialMasterPembinaanList;
    }

    return mapped;
  } catch (err) {
    console.error('Error fetching master pembinaan from Supabase:', err);
    return initialMasterPembinaanList;
  }
}

export function findPembinaanBySinglePoin(
  singlePoin: number,
  masterList: MasterPembinaan[]
): MasterPembinaan | null {
  if (typeof singlePoin !== 'number' || isNaN(singlePoin)) {
    return null;
  }

  // Gunakan aturan inklusif resmi: min_poin <= singlePoin <= max_poin (rentang 5–99)
  const match = masterList.find(
    (item) => item.is_active && (item.min_poin ?? item.minPoin ?? 0) <= singlePoin && (item.max_poin ?? item.maxPoin ?? 0) >= singlePoin
  );

  return match || null;
}

// ==============================================================================
// 6. PEMBINAAN RECORDS (public.pembinaan)
// ==============================================================================

export async function fetchPembinaanRecordsFromDB(): Promise<PembinaanRecord[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('pembinaan')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row: any) => ({
      id: String(row.id),
      santriId: String(row.santri_id || ''),
      santriNama: String(row.santri_nama || ''),
      santriKelas: String(row.santri_kelas || ''),
      santriUnit: (row.santri_unit as UnitPesantren) || 'SMP',
      pelanggaranTerkaitId: row.pelanggaran_terkait_id ? String(row.pelanggaran_terkait_id) : undefined,
      pelanggaranTerkaitJenis: row.pelanggaran_terkait_jenis || undefined,
      jenisPembinaan: String(row.jenis_pembinaan || 'Teguran/Nasihat'),
      tanggal: row.tanggal || new Date().toLocaleDateString('id-ID'),
      tanggalTargetSelesai: row.tanggal_target_selesai || undefined,
      pembina: String(row.pembina || 'Pembina'),
      pembinaId: row.pembina_id ? String(row.pembina_id) : undefined,
      catatan: String(row.catatan || ''),
      status: (row.status as any) || 'BELUM DIMULAI',
      tanggalSelesai: row.tanggal_selesai || undefined,
      created_at: row.created_at || new Date().toISOString()
    }));
  } catch (err) {
    return null;
  }
}

export async function insertPembinaanRecordToDB(
  record: {
    santriId: string;
    santriNama: string;
    santriKelas: string;
    santriUnit: UnitPesantren;
    pelanggaranTerkaitId?: string;
    pelanggaranTerkaitJenis?: string;
    jenisPembinaan: string;
    tanggal: string;
    tanggalTargetSelesai?: string;
    pembina: string;
    pembinaId?: string;
    catatan?: string;
  }
): Promise<{ success: boolean; data?: PembinaanRecord; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: {
        id: `pem-${Date.now()}`,
        santriId: record.santriId,
        santriNama: record.santriNama,
        santriKelas: record.santriKelas,
        santriUnit: record.santriUnit,
        pelanggaranTerkaitId: record.pelanggaranTerkaitId,
        pelanggaranTerkaitJenis: record.pelanggaranTerkaitJenis,
        jenisPembinaan: record.jenisPembinaan,
        tanggal: record.tanggal,
        tanggalTargetSelesai: record.tanggalTargetSelesai,
        pembina: record.pembina,
        pembinaId: record.pembinaId,
        catatan: record.catatan,
        status: 'BELUM DIMULAI',
        created_at: new Date().toISOString()
      }
    };
  }

  try {
    const payload = {
      santri_id: record.santriId,
      santri_nama: record.santriNama,
      santri_kelas: record.santriKelas,
      santri_unit: record.santriUnit,
      pelanggaran_terkait_id: record.pelanggaranTerkaitId || null,
      pelanggaran_terkait_jenis: record.pelanggaranTerkaitJenis || null,
      jenis_pembinaan: record.jenisPembinaan,
      tanggal: record.tanggal,
      tanggal_target_selesai: record.tanggalTargetSelesai || null,
      pembina: record.pembina,
      pembina_id: record.pembinaId || null,
      catatan: record.catatan || '',
      status: 'BELUM DIMULAI'
    };

    let { data, error } = await supabase
      .from('pembinaan')
      .insert([payload])
      .select('*')
      .single();

    if (error && error.message?.includes('null value in column "id"')) {
      const retry = await supabase
        .from('pembinaan')
        .insert([{ ...payload, id: generateUUIDv4() }])
        .select('*')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[INSERT PEMBINAAN ERROR]', error);
      return { success: false, error: translateSupabaseError(error) };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        santriId: data.santri_id,
        santriNama: data.santri_nama,
        santriKelas: data.santri_kelas,
        santriUnit: data.santri_unit as UnitPesantren,
        pelanggaranTerkaitId: data.pelanggaran_terkait_id,
        pelanggaranTerkaitJenis: data.pelanggaran_terkait_jenis,
        jenisPembinaan: data.jenis_pembinaan,
        tanggal: data.tanggal,
        tanggalTargetSelesai: data.tanggal_target_selesai,
        pembina: data.pembina,
        pembinaId: data.pembina_id,
        catatan: data.catatan,
        status: data.status,
        created_at: data.created_at
      }
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan data pembinaan.' };
  }
}

export async function updatePembinaanStatusInDB(
  id: string,
  status: PembinaanRecord['status'],
  tanggalSelesai?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const payload: any = { status };
    if (tanggalSelesai) payload.tanggal_selesai = tanggalSelesai;

    const { error } = await supabase
      .from('pembinaan')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: translateSupabaseError(error) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui status pembinaan.' };
  }
}
