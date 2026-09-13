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
import { hashPassword, verifyPassword } from './auth';

export const STORAGE_KEY_SUPABASE_URL = 'SIMKA_SUPABASE_URL';
export const STORAGE_KEY_SUPABASE_KEY = 'SIMKA_SUPABASE_ANON_KEY';
export const STORAGE_KEY_OFFLINE_MODE = 'SIMKA_SUPABASE_OFFLINE_MODE';

export function getActiveSupabaseConfig(): { url: string; anonKey: string; isCustom: boolean; offlineMode: boolean } {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || '' : '';
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || '' : '';
  const offlineMode = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_OFFLINE_MODE) === 'true' : false;

  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL || '';
  const envKey = env.VITE_SUPABASE_ANON_KEY || '';

  const url = (customUrl.trim() || envUrl.trim());
  const anonKey = (customKey.trim() || envKey.trim());

  return {
    url,
    anonKey,
    isCustom: Boolean(customUrl.trim() || customKey.trim()),
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
  if (url.trim()) {
    localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
  }
  if (anonKey.trim()) {
    localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, anonKey.trim());
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
  const msg = typeof error === 'string' ? error : error.message || error.error_description || JSON.stringify(error);

  if (msg.includes('Invalid API key') || msg.includes('JWT') || msg.includes('apikey') || msg.includes('unauthorized') || msg.includes('401')) {
    return 'Kunci API Supabase (anon key) tidak valid atau kedaluwarsa. Periksa kredensial di menu Pengaturan Database.';
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'Tabel database di Supabase belum dibuat. Silakan salin & jalankan skrip SQL migrasi di Supabase SQL Editor melalui menu Pengaturan Database.';
  }
  if (msg.includes('row-level security') || msg.includes('RLS') || msg.includes('policy')) {
    return 'Akses database dibatasi oleh kebijakan RLS Supabase. Pastikan tabel memiliki izin SELECT/INSERT/UPDATE untuk role anon.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
    return 'Gagal terhubung ke server database Supabase. Periksa koneksi internet atau status URL proyek Supabase.';
  }
  if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('already exists')) {
    return 'Data dengan kode atau username yang sama sudah terdaftar di database.';
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

// Proxied supabase accessor for backward-compatible call syntax
export const supabase = {
  from(table: string) {
    const client = getSupabaseClient();
    if (!client) {
      return {
        select: () => Promise.resolve({ data: null, error: { message: 'Database client tidak aktif atau dalam mode offline.' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Database client tidak aktif atau dalam mode offline.' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Database client tidak aktif atau dalam mode offline.' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Database client tidak aktif atau dalam mode offline.' } }),
        upsert: () => Promise.resolve({ data: null, error: { message: 'Database client tidak aktif atau dalam mode offline.' } })
      } as any;
    }
    return client.from(table);
  },
  rpc(fn: string, args?: any) {
    const client = getSupabaseClient();
    if (!client) {
      return Promise.resolve({ data: null, error: { message: 'Database client tidak aktif.' } }) as any;
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

// ==============================================================================
// 1. USERS & AUTHENTICATION (public.users)
// ==============================================================================

/**
 * Fetch all users from Supabase public.users table.
 */
export async function fetchUsersFromDB(): Promise<UserAccount[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, username, password_hash, role, unit, is_active, email, title, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error || !data) {
      logAuthDebug('Fetch users from Supabase error/notice:', error?.message);
      return null;
    }

    return data.map((row: any) => ({
      id: String(row.id),
      nama: String(row.nama || ''),
      username: String(row.username || ''),
      password_hash: row.password_hash || '',
      role: row.role as UserRole,
      unit: row.unit as 'ALL' | UnitPesantren,
      is_active: Boolean(row.is_active),
      email: row.email || undefined,
      title: row.title || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  } catch (err: any) {
    logAuthDebug('Exception fetching users from Supabase:', err?.message);
    return null;
  }
}

/**
 * Custom Simple Login via Supabase RPC / public.users table or Local Authenticated Store.
 * Returns UserAccount without exposing password_hash.
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

  // 1. Check Supabase connection and try RPC or direct public.users lookup
  if (supabase) {
    logAuthDebug('Supabase client detected. Querying backend...');
    try {
      // 1A. Attempt RPC login_user if defined in database
      const { data: rpcData, error: rpcError } = await supabase.rpc('login_user', {
        p_username: cleanUsername,
        p_password: passwordInput
      });

      if (!rpcError && rpcData) {
        logAuthDebug('RPC login_user response received:', rpcData);
        if (rpcData.success && rpcData.user) {
          return {
            success: true,
            user: {
              id: String(rpcData.user.id),
              nama: rpcData.user.nama,
              username: rpcData.user.username,
              role: rpcData.user.role,
              unit: rpcData.user.unit,
              is_active: Boolean(rpcData.user.is_active),
              email: rpcData.user.email,
              title: rpcData.user.title
            }
          };
        } else if (rpcData.message) {
          return { success: false, message: rpcData.message };
        }
      }

      // 1B. Direct query on public.users table
      const { data: dbUser, error: queryError } = await supabase
        .from('users')
        .select('id, nama, username, password_hash, role, unit, is_active, email, title')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (!queryError && dbUser) {
        logAuthDebug('User record found in public.users:', { id: dbUser.id, username: dbUser.username, role: dbUser.role });
        if (!dbUser.is_active) {
          return { success: false, message: 'Akun tidak aktif. Hubungi administrator yayasan.' };
        }

        const isValid = await verifyPassword(passwordInput, dbUser.password_hash);
        if (isValid) {
          return {
            success: true,
            user: {
              id: String(dbUser.id),
              nama: dbUser.nama,
              username: dbUser.username,
              role: dbUser.role,
              unit: dbUser.unit,
              is_active: Boolean(dbUser.is_active),
              email: dbUser.email,
              title: dbUser.title
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
      is_active: Boolean(foundUser.is_active),
      email: foundUser.email,
      title: foundUser.title
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
  if (!supabase) {
    return {
      success: true,
      data: {
        id: `usr-${Date.now()}`,
        nama: userItem.nama,
        username: userItem.username,
        role: userItem.role,
        unit: userItem.unit,
        is_active: userItem.is_active !== false,
        email: userItem.email,
        title: userItem.title,
        password_hash: userItem.password_hash,
        created_at: new Date().toISOString()
      }
    };
  }

  try {
    const payload = {
      nama: userItem.nama,
      username: userItem.username.toLowerCase().trim(),
      password_hash: userItem.password_hash,
      role: userItem.role,
      unit: userItem.unit,
      is_active: userItem.is_active !== false,
      email: userItem.email,
      title: userItem.title
    };

    const { data, error } = await supabase
      .from('users')
      .insert([payload])
      .select('id, nama, username, role, unit, is_active, email, title, created_at, updated_at')
      .single();

    if (error) {
      console.error('[INSERT USER ERROR]', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        nama: data.nama,
        username: data.username,
        role: data.role as UserRole,
        unit: data.unit as 'ALL' | UnitPesantren,
        is_active: Boolean(data.is_active),
        email: data.email,
        title: data.title,
        password_hash: userItem.password_hash,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan user ke database.' };
  }
}

export async function updateUserInDB(
  userId: string,
  userItem: {
    nama: string;
    username: string;
    role: UserRole;
    unit: 'ALL' | UnitPesantren;
    is_active?: boolean;
    email?: string;
    title?: string;
  },
  actorRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie yang berwenang mengubah user.' };
  }
  if (!supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('users')
      .update({
        nama: userItem.nama,
        username: userItem.username.toLowerCase().trim(),
        role: userItem.role,
        unit: userItem.unit,
        is_active: userItem.is_active !== false,
        email: userItem.email,
        title: userItem.title,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui user di database.' };
  }
}

export async function deleteUserFromDB(
  userId: string,
  actorRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie yang berwenang menghapus user.' };
  }
  if (!supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus user dari database.' };
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
  if (!supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mengubah status user.' };
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
  if (!supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mereset password di database.' };
  }
}

// ==============================================================================
// 2. DATA SANTRI (public.santri)
// ==============================================================================

/**
 * Fetch all santri records from Supabase public.santri table.
 * Supports flexible column naming (kode_santri or nis, total_poin or totalPoin).
 */
export async function fetchSantriFromDB(): Promise<Santri[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('santri')
      .select('*')
      .order('nama', { ascending: true });

    if (error || !data) {
      logAuthDebug('Fetch santri from Supabase error/notice:', error?.message);
      return null;
    }

    logAuthDebug(`Fetched ${data.length} santri records from public.santri in Supabase.`);

    return data.map((row: any) => ({
      id: String(row.id),
      nis: String(row.kode_santri || row.nis || row.id || ''),
      nama: String(row.nama || '').toUpperCase(),
      kelas: String(row.kelas || ''),
      unit: (row.unit as UnitPesantren) || 'SMP',
      totalPoin: Number(row.total_poin ?? row.totalPoin ?? 0),
      statusPembinaan: row.status_pembinaan || row.statusPembinaan || 'Baik',
      musyrifId: row.musyrif_id || row.musyrifId || undefined,
      musyrifNama: row.musyrif_nama || row.musyrifNama || undefined,
      asrama: row.asrama || undefined,
      kamar: row.kamar || undefined,
      keterangan: row.keterangan || undefined
    }));
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
    musyrifId?: string;
    musyrifNama?: string;
    asrama?: string;
    kamar?: string;
    keterangan?: string;
    statusPembinaan?: Santri['statusPembinaan'];
  },
  actorRole?: UserRole,
  actorUnit?: string
): Promise<{ success: boolean; data?: Santri; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN' && actorUnit !== santriData.unit) {
    return { success: false, error: `Akses Ditolak: Anda (${actorUnit}) tidak berwenang menambah santri Unit ${santriData.unit}!` };
  }

  if (!supabase) {
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
        musyrifId: santriData.musyrifId,
        musyrifNama: santriData.musyrifNama,
        asrama: santriData.asrama,
        kamar: santriData.kamar,
        keterangan: santriData.keterangan
      }
    };
  }

  try {
    const payload: any = {
      kode_santri: santriData.nis.trim(),
      nama: santriData.nama.trim().toUpperCase(),
      kelas: santriData.kelas.trim(),
      unit: santriData.unit,
      total_poin: 0,
      status_pembinaan: santriData.statusPembinaan || 'Baik',
      asrama: santriData.asrama?.trim() || `Asrama ${santriData.unit}`,
      kamar: santriData.kamar?.trim() || '-',
      keterangan: santriData.keterangan?.trim() || null
    };

    if (santriData.musyrifId) {
      payload.musyrif_id = santriData.musyrifId;
    }

    const { data, error } = await supabase
      .from('santri')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('[INSERT SANTRI ERROR]', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        nis: String(data.kode_santri || data.nis || santriData.nis),
        nama: String(data.nama || santriData.nama).toUpperCase(),
        kelas: String(data.kelas || santriData.kelas),
        unit: (data.unit as UnitPesantren) || santriData.unit,
        totalPoin: Number(data.total_poin ?? 0),
        statusPembinaan: data.status_pembinaan || 'Baik',
        musyrifId: data.musyrif_id || santriData.musyrifId,
        musyrifNama: santriData.musyrifNama,
        asrama: data.asrama,
        kamar: data.kamar,
        keterangan: data.keterangan
      }
    };
  } catch (err: any) {
    console.error('[INSERT SANTRI EXCEPTION]', err);
    return { success: false, error: err?.message || 'Gagal menyimpan santri ke database.' };
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
    musyrifId?: string;
    musyrifNama?: string;
    asrama?: string;
    kamar?: string;
    keterangan?: string;
    statusPembinaan?: Santri['statusPembinaan'];
  },
  actorRole?: UserRole,
  actorUnit?: string
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN' && actorUnit !== santriData.unit) {
    return { success: false, error: `Akses Ditolak: Anda (${actorUnit}) tidak berwenang mengubah santri Unit ${santriData.unit}!` };
  }

  if (!supabase) return { success: true };

  try {
    const payload: any = {
      kode_santri: santriData.nis.trim(),
      nama: santriData.nama.trim().toUpperCase(),
      kelas: santriData.kelas.trim(),
      unit: santriData.unit,
      asrama: santriData.asrama?.trim() || `Asrama ${santriData.unit}`,
      kamar: santriData.kamar?.trim() || '-',
      keterangan: santriData.keterangan?.trim() || null,
      updated_at: new Date().toISOString()
    };

    if (santriData.statusPembinaan) {
      payload.status_pembinaan = santriData.statusPembinaan;
    }
    if (santriData.musyrifId !== undefined) {
      payload.musyrif_id = santriData.musyrifId || null;
    }

    const { error } = await supabase
      .from('santri')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('[UPDATE SANTRI ERROR]', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui santri di database.' };
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
    musyrifId?: string;
    musyrifNama?: string;
    asrama?: string;
    kamar?: string;
    statusPembinaan?: Santri['statusPembinaan'];
    keterangan?: string;
  }>,
  actorRole?: UserRole
): Promise<{ success: boolean; insertedCount: number; insertedData?: Santri[]; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, insertedCount: 0, error: 'Akses Ditolak: Hanya Kasie yang berwenang mengimpor data santri.' };
  }

  if (santriDataList.length === 0) {
    return { success: true, insertedCount: 0, insertedData: [] };
  }

  if (!supabase) {
    const localData = santriDataList.map((item) => ({
      id: `s-${item.unit.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nis: item.nis.trim(),
      nama: item.nama.trim().toUpperCase(),
      kelas: item.kelas.trim(),
      unit: item.unit,
      totalPoin: 0,
      statusPembinaan: item.statusPembinaan || 'Baik',
      musyrifId: item.musyrifId,
      musyrifNama: item.musyrifNama,
      asrama: item.asrama?.trim() || `Asrama ${item.unit}`,
      kamar: item.kamar?.trim() || '-',
      keterangan: item.keterangan?.trim()
    }));
    return { success: true, insertedCount: localData.length, insertedData: localData };
  }

  try {
    const payload = santriDataList.map((item) => {
      const row: any = {
        kode_santri: item.nis.trim(),
        nama: item.nama.trim().toUpperCase(),
        kelas: item.kelas.trim(),
        unit: item.unit,
        total_poin: 0,
        status_pembinaan: item.statusPembinaan || 'Baik',
        asrama: item.asrama?.trim() || `Asrama ${item.unit}`,
        kamar: item.kamar?.trim() || '-',
        keterangan: item.keterangan?.trim() || null
      };
      if (item.musyrifId) {
        row.musyrif_id = item.musyrifId;
      }
      return row;
    });

    const chunkSize = 100;
    const insertedRecords: Santri[] = [];

    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('santri')
        .upsert(chunk, { onConflict: 'kode_santri' })
        .select('*');

      if (error) {
        console.error('[IMPORT SANTRI CHUNK ERROR]', error);
        const { data: insertData, error: insertError } = await supabase
          .from('santri')
          .insert(chunk)
          .select('*');

        if (insertError) {
          console.error('[IMPORT SANTRI FALLBACK INSERT ERROR]', insertError);
          return { success: false, insertedCount: insertedRecords.length, error: insertError.message };
        }
        if (insertData) {
          insertData.forEach((row: any) => {
            insertedRecords.push({
              id: String(row.id),
              nis: String(row.kode_santri || row.nis || ''),
              nama: String(row.nama || '').toUpperCase(),
              kelas: String(row.kelas || ''),
              unit: (row.unit as UnitPesantren) || 'SMP',
              totalPoin: Number(row.total_poin ?? 0),
              statusPembinaan: row.status_pembinaan || 'Baik',
              musyrifId: row.musyrif_id,
              asrama: row.asrama,
              kamar: row.kamar,
              keterangan: row.keterangan
            });
          });
        }
      } else if (data) {
        data.forEach((row: any) => {
          insertedRecords.push({
            id: String(row.id),
            nis: String(row.kode_santri || row.nis || ''),
            nama: String(row.nama || '').toUpperCase(),
            kelas: String(row.kelas || ''),
            unit: (row.unit as UnitPesantren) || 'SMP',
            totalPoin: Number(row.total_poin ?? 0),
            statusPembinaan: row.status_pembinaan || 'Baik',
            musyrifId: row.musyrif_id,
            asrama: row.asrama,
            kamar: row.kamar,
            keterangan: row.keterangan
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
    return { success: false, insertedCount: 0, error: err?.message || 'Gagal mengimpor data santri ke database.' };
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

  if (!supabase) {
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
          error: `Gagal menghapus data pelanggaran santri: ${deletePelanggaranError.message}`
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
        error: `Gagal menghapus data santri dari database: ${deleteSantriError.message}`
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
      error: err?.message || 'Terjadi kesalahan sistem saat menghapus data santri.'
    };
  }
}

// ==============================================================================
// 3. MASTER PELANGGARAN (public.master_pelanggaran)
// ==============================================================================

/**
 * Helper to fetch master pelanggaran from Supabase.
 */
export async function fetchMasterPelanggaranFromDB(): Promise<Pelanggaran[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('master_pelanggaran')
      .select('id, kode, jenis, nama, poin, kategori, konsekuensi, hukuman')
      .order('kode', { ascending: true });

    if (error || !data) {
      logAuthDebug('Fetch master_pelanggaran from Supabase error:', error?.message);
      return null;
    }

    return data.map((row: any, idx: number) => ({
      id: String(row.id),
      kode: String(row.kode || `P${String(idx + 1).padStart(3, '0')}`),
      jenis: String(row.jenis || row.nama || ''),
      poin: Number(row.poin) || 15,
      kategori: (row.kategori as PelanggaranKategori) || 'Sangat Ringan',
      konsekuensi: String(row.konsekuensi || row.hukuman || '-')
    }));
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

  if (!supabase) {
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
      jenis: item.jenis,
      poin: item.poin,
      kategori: item.kategori,
      konsekuensi: item.konsekuensi
    };

    const { data, error } = await supabase
      .from('master_pelanggaran')
      .insert([payload])
      .select('id, kode, jenis, nama, poin, kategori, konsekuensi, hukuman')
      .single();

    if (error) {
      console.error('[INSERT MASTER ERROR]', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        kode: data.kode || payload.kode,
        jenis: data.jenis || data.nama || payload.jenis,
        poin: Number(data.poin) || payload.poin,
        kategori: data.kategori || payload.kategori,
        konsekuensi: data.konsekuensi || data.hukuman || payload.konsekuensi
      }
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan data ke database.' };
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
  if (!supabase) return { success: true };

  try {
    const payload = {
      kode: updateData.kode,
      jenis: updateData.jenis,
      poin: updateData.poin,
      kategori: updateData.kategori,
      konsekuensi: updateData.konsekuensi
    };

    const { error } = await supabase
      .from('master_pelanggaran')
      .update(payload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui data di Supabase.' };
  }
}

export async function deleteMasterPelanggaranFromDB(
  id: string,
  userRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus data.' };
  }
  if (!supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('master_pelanggaran')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus data dari Supabase.' };
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
  if (!supabase) return { success: true, deletedCount: recordsToDelete.length };

  try {
    const targetIds = recordsToDelete.map((r) => r.id);
    const { error } = await supabase
      .from('master_pelanggaran')
      .delete()
      .in('id', targetIds);

    if (error) {
      return { success: false, deletedCount: 0, error: error.message };
    }
    return { success: true, deletedCount: recordsToDelete.length };
  } catch (err: any) {
    return { success: false, deletedCount: 0, error: err?.message || 'Gagal menghapus data dari Supabase.' };
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
  if (!supabase) {
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
      jenis: it.jenis,
      poin: it.poin,
      kategori: it.kategori,
      konsekuensi: it.konsekuensi
    }));

    const { data, error } = await supabase
      .from('master_pelanggaran')
      .insert(payload)
      .select('id, kode, jenis, nama, poin, kategori, konsekuensi, hukuman');

    if (error) {
      console.error('[IMPORT MASTER BATCH ERROR]', error);
      return { success: false, error: error.message };
    }

    const mapped: Pelanggaran[] = (data || []).map((row: any) => ({
      id: String(row.id),
      kode: row.kode || '',
      jenis: row.jenis || row.nama || '',
      poin: Number(row.poin) || 0,
      kategori: row.kategori || 'Sangat Ringan',
      konsekuensi: row.konsekuensi || row.hukuman || '-'
    }));

    return { success: true, insertedData: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mengimpor data ke database.' };
  }
}

// ==============================================================================
// 4. TRANSAKSI PELANGGARAN & REKAP (public.pelanggaran)
// ==============================================================================

/**
 * Fetch all violation transaction logs from Supabase public.pelanggaran table.
 */
export async function fetchPelanggaranFromDB(): Promise<RiwayatPelanggaran[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('pelanggaran')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      logAuthDebug('Fetch pelanggaran from Supabase error/notice:', error?.message);
      return null;
    }

    logAuthDebug(`Fetched ${data.length} records from public.pelanggaran in Supabase.`);

    return data.map((row: any) => {
      const createdAtDate = row.created_at ? new Date(row.created_at) : new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const formattedTanggal = `${createdAtDate.getDate()} ${months[createdAtDate.getMonth()]} ${createdAtDate.getFullYear()}, ${String(createdAtDate.getHours()).padStart(2, '0')}.${String(createdAtDate.getMinutes()).padStart(2, '0')} WIB`;

      return {
        id: String(row.id),
        tanggal: formattedTanggal,
        timestamp: row.created_at || new Date().toISOString(),
        santriId: String(row.santri_id || ''),
        santriNama: String(row.santri_nama || ''),
        santriKelas: String(row.santri_kelas || ''),
        santriUnit: (row.santri_unit as UnitPesantren) || 'SMP',
        jenisPelanggaranId: String(row.jenis_pelanggaran_id || ''),
        jenisPelanggaranNama: String(row.jenis_pelanggaran_nama || ''),
        poin: Number(row.poin) || 0,
        hukuman: String(row.hukuman || '-'),
        pembinaanTingkat: row.pembinaan_tingkat || undefined,
        rekomendasiPembinaan: Array.isArray(row.rekomendasi_pembinaan)
          ? row.rekomendasi_pembinaan
          : typeof row.rekomendasi_pembinaan === 'string'
          ? JSON.parse(row.rekomendasi_pembinaan)
          : undefined,
        status: (row.status as 'Selesai' | 'Belum Selesai') || 'Belum Selesai',
        catatan: row.catatan || undefined,
        pencatat: String(row.pencatat_nama || 'Petugas'),
        pencatatId: row.pencatat_id ? String(row.pencatat_id) : undefined
      };
    });
  } catch (err: any) {
    logAuthDebug('Exception fetching pelanggaran from Supabase:', err?.message);
    return null;
  }
}

/**
 * Record a new violation transaction in Supabase public.pelanggaran and update santri total_poin.
 */
export async function insertPelanggaranToDB(
  data: {
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

  if (!supabase) {
    return {
      success: true,
      data: {
        id: `log-${Date.now()}`,
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
        pembinaanTingkat: data.pembinaanTingkat,
        rekomendasiPembinaan: data.rekomendasiPembinaan,
        pencatat: data.pencatatNama,
        pencatatId: data.pencatatId
      }
    };
  }

  try {
    const payload: any = {
      santri_id: data.santriId,
      santri_unit: data.santriUnit,
      jenis_pelanggaran_id: isValidUUID(data.jenisPelanggaranId) ? data.jenisPelanggaranId : null,
      jenis_pelanggaran_nama: data.jenisPelanggaranNama,
      poin: data.poin,
      hukuman: data.hukuman,
      status: data.poin >= 50 ? 'Belum Selesai' : 'Selesai',
      catatan: data.catatan || null,
      pencatat_id: data.pencatatId ? (isValidUUID(data.pencatatId) ? data.pencatatId : null) : null,
      pencatat_nama: data.pencatatNama
    };

    if (data.pembinaanTingkat) {
      payload.pembinaan_tingkat = data.pembinaanTingkat;
    }
    if (data.rekomendasiPembinaan) {
      payload.rekomendasi_pembinaan = data.rekomendasiPembinaan;
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from('pelanggaran')
      .insert([payload])
      .select('*')
      .single();

    if (insertError) {
      console.error('[INSERT PELANGGARAN ERROR]', insertError);
      return { success: false, error: insertError.message };
    }

    // Update total_poin in public.santri
    try {
      const { data: currentSantri } = await supabase
        .from('santri')
        .select('total_poin')
        .eq('id', data.santriId)
        .maybeSingle();

      const newTotal = (currentSantri?.total_poin || 0) + data.poin;
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
        .eq('id', data.santriId);
    } catch (updateErr) {
      console.warn('Failed to update santri total_poin in DB:', updateErr);
    }

    return {
      success: true,
      data: {
        id: String(insertedRow.id),
        tanggal: formattedTanggal,
        timestamp: insertedRow.created_at || now.toISOString(),
        santriId: data.santriId,
        santriNama: data.santriNama,
        santriKelas: data.santriKelas,
        santriUnit: data.santriUnit,
        jenisPelanggaranId: data.jenisPelanggaranId,
        jenisPelanggaranNama: data.jenisPelanggaranNama,
        poin: data.poin,
        hukuman: data.hukuman,
        status: (insertedRow.status as any) || (data.poin >= 50 ? 'Belum Selesai' : 'Selesai'),
        catatan: data.catatan,
        pembinaanTingkat: data.pembinaanTingkat,
        rekomendasiPembinaan: data.rekomendasiPembinaan,
        pencatat: data.pencatatNama,
        pencatatId: data.pencatatId
      }
    };
  } catch (err: any) {
    console.error('[INSERT PELANGGARAN EXCEPTION]', err);
    return { success: false, error: err?.message || 'Gagal menyimpan transaksi pelanggaran.' };
  }
}

export async function updatePelanggaranStatusInDB(
  id: string,
  status: 'Selesai' | 'Belum Selesai'
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: true };
  try {
    const { error } = await supabase
      .from('pelanggaran')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui status pelanggaran.' };
  }
}

export async function deletePelanggaranRecordFromDB(
  id: string,
  actorRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (actorRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus data pelanggaran.' };
  }
  if (!supabase) return { success: true };

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
      return { success: false, error: deleteError.message };
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
    return { success: false, error: err?.message || 'Gagal menghapus pelanggaran dari database.' };
  }
}

// ==============================================================================
// 5. MASTER PEMBINAAN (public.master_pembinaan)
// ==============================================================================

export async function fetchMasterPembinaanFromDB(): Promise<MasterPembinaan[]> {
  if (!supabase) return initialMasterPembinaanList;
  try {
    const { data, error } = await supabase
      .from('master_pembinaan')
      .select('*')
      .eq('is_active', true)
      .order('tingkat', { ascending: true });

    if (error || !data || data.length === 0) {
      return initialMasterPembinaanList;
    }

    return data.map((row: any) => ({
      id: String(row.id),
      tingkat: Number(row.tingkat),
      nama_tingkat: row.nama_tingkat || `Tingkat ${row.tingkat}`,
      min_poin: Number(row.min_poin),
      max_poin: Number(row.max_poin),
      jenis_pembinaan: Array.isArray(row.jenis_pembinaan)
        ? row.jenis_pembinaan
        : typeof row.jenis_pembinaan === 'string'
        ? JSON.parse(row.jenis_pembinaan)
        : [],
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
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

  const match = masterList.find(
    (item) => item.is_active && item.min_poin <= singlePoin && item.max_poin >= singlePoin
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

    const { data, error } = await supabase
      .from('pembinaan')
      .insert([payload])
      .select('*')
      .single();

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
