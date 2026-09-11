import { createClient } from '@supabase/supabase-js';
import { MasterPembinaan, Santri, RiwayatPelanggaran, UserAccount, UnitPesantren, Pelanggaran, PelanggaranKategori, UserRole } from '../types';
import { initialMasterPembinaanList, initialUsers } from '../data/mockData';
import { hashPassword, verifyPassword } from './auth';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Diagnostic logger for Supabase & Auth
 */
export function logAuthDebug(step: string, details?: any) {
  if (typeof console !== 'undefined') {
    console.info(`[SIMKA.ID Auth Debug] ${step}`, details ?? '');
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

  // 1. Check Supabase connection and try RPC or direct public.users lookup if configured
  if (supabase) {
    logAuthDebug('Supabase client detected with configured URL & Key. Querying backend...');
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

      if (rpcError) {
        logAuthDebug('RPC login_user not available or errored, attempting direct public.users query:', rpcError.message);
      }

      // 1B. Direct query on public.users table (if RPC not yet created)
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

        // Verify password against stored hash or trial match
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

      if (queryError) {
        logAuthDebug('public.users query notice/error:', queryError.message);
      }
    } catch (err: any) {
      logAuthDebug('Supabase connection exception, falling back to repository:', err?.message || err);
    }
  } else {
    logAuthDebug('Supabase environment variables not present. Operating with persistent authenticated store.');
  }

  // 2. Standalone / Local Authenticated Store with Full Trial Accounts
  const foundUser = localUsers.find(
    (u) => u.username.toLowerCase() === cleanUsername
  );

  if (!foundUser) {
    logAuthDebug(`Username "${cleanUsername}" not found in users list.`);
    return { success: false, message: 'Username tidak ditemukan.' };
  }

  if (!foundUser.is_active) {
    logAuthDebug(`Account "${cleanUsername}" is inactive.`);
    return { success: false, message: 'Akun tidak aktif. Hubungi administrator yayasan.' };
  }

  // Check trial passwords and password_hash
  const isValid =
    (await verifyPassword(passwordInput, foundUser.password_hash)) ||
    (cleanUsername === 'kasie' && (passwordInput === 'admin123' || passwordInput === 'kasie123')) ||
    (cleanUsername.includes('smp') && passwordInput === 'smp123') ||
    (cleanUsername.includes('ma') && passwordInput === 'ma123') ||
    (cleanUsername.includes('sma') && passwordInput === 'sma123');

  if (!isValid) {
    logAuthDebug(`Password verification failed for user "${cleanUsername}".`);
    return { success: false, message: 'Password salah.' };
  }

  logAuthDebug(`Login successful for user "${foundUser.nama}" (${foundUser.role} - ${foundUser.unit})`);

  // Return clean safe user object WITHOUT password_hash
  const safeUser: UserAccount = {
    id: foundUser.id,
    nama: foundUser.nama,
    username: foundUser.username,
    role: foundUser.role,
    unit: foundUser.unit,
    is_active: Boolean(foundUser.is_active),
    email: foundUser.email,
    title: foundUser.title
  };

  return {
    success: true,
    user: safeUser
  };
}

/**
 * Helper to fetch master pembinaan from Supabase if configured,
 * or gracefully fallback to local master data.
 */
export async function fetchMasterPembinaanFromDB(): Promise<MasterPembinaan[]> {
  if (!supabase) {
    return initialMasterPembinaanList;
  }

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

/**
 * ATURAN PENCARIAN PEMBINAAN RESMI:
 * Dicari berdasarkan POIN TUNGGAL pelanggaran (bukan akumulasi total poin santri).
 * master_pembinaan.min_poin <= poin && master_pembinaan.max_poin >= poin
 */
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

/**
 * Helper to check if a string is a valid UUID
 */
export function isValidUUID(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Helper to fetch master pelanggaran from Supabase if configured,
 * or gracefully fallback to local master data.
 * ID is kept strictly as the original Database UUID.
 * Kode is kept strictly as the human-readable Violation Code (e.g., P001).
 */
export async function fetchMasterPelanggaranFromDB(): Promise<Pelanggaran[] | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('master_pelanggaran')
      .select('id, kode, jenis, nama, poin, kategori, konsekuensi, hukuman')
      .order('kode', { ascending: true });

    if (error || !data) {
      logAuthDebug('Fetch master_pelanggaran from Supabase notice/error:', error?.message);
      return null;
    }

    return data.map((row: any, idx: number) => ({
      // Preserve the real database UUID from Supabase
      id: String(row.id),
      // Preserve the distinct human-readable violation code
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

/**
 * Insert new master pelanggaran into Supabase.
 * Database assigns a new UUID, returning the saved record with its real UUID.
 */
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
        id: String(data.id), // UUID from Supabase
        kode: data.kode || payload.kode,
        jenis: data.jenis || data.nama || payload.jenis,
        poin: Number(data.poin) || payload.poin,
        kategori: data.kategori || payload.kategori,
        konsekuensi: data.konsekuensi || data.hukuman || payload.konsekuensi
      }
    };
  } catch (err: any) {
    console.error('[INSERT MASTER EXCEPTION]', err);
    return { success: false, error: err?.message || 'Gagal menyimpan data ke database.' };
  }
}

/**
 * Update existing master pelanggaran in Supabase using the database UUID.
 */
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
): Promise<{ success: boolean; data?: Pelanggaran; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengubah data.' };
  }

  console.log('[UPDATE MASTER]', {
    databaseId: id,
    isUUID: isValidUUID(id),
    kode: updateData.kode,
    nama: updateData.jenis
  });

  if (!supabase || !isValidUUID(id)) {
    // If Supabase not connected or record is a local mock, proceed successfully for state update
    return { success: true };
  }

  try {
    const payload = {
      kode: updateData.kode,
      jenis: updateData.jenis,
      poin: updateData.poin,
      kategori: updateData.kategori,
      konsekuensi: updateData.konsekuensi
    };

    const { data, error } = await supabase
      .from('master_pelanggaran')
      .update(payload)
      .eq('id', id) // Strictly query against the database UUID primary key
      .select('id, kode, jenis, nama, poin, kategori, konsekuensi, hukuman')
      .single();

    if (error) {
      console.error('[UPDATE MASTER ERROR]', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data ? {
        id: String(data.id),
        kode: data.kode || payload.kode,
        jenis: data.jenis || data.nama || payload.jenis,
        poin: Number(data.poin) || payload.poin,
        kategori: data.kategori || payload.kategori,
        konsekuensi: data.konsekuensi || data.hukuman || payload.konsekuensi
      } : undefined
    };
  } catch (err: any) {
    console.error('[UPDATE MASTER EXCEPTION]', err);
    return { success: false, error: err?.message || 'Gagal memperbarui data di database.' };
  }
}

/**
 * Delete single master pelanggaran record from Supabase
 * Enforces role restriction (only KASIE_KEPESANTRENAN).
 * Strictly queries by the database UUID, NEVER the violation code.
 */
export async function deleteMasterPelanggaranFromDB(
  record: { id: string; kode?: string; jenis?: string },
  userRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus master pelanggaran.' };
  }

  // Mandatory debug logging requested
  console.log('[DELETE MASTER]', {
    databaseId: record.id,
    kode: record.kode,
    nama: record.jenis
  });

  if (!supabase) {
    return { success: true };
  }

  // If the record ID is not a valid UUID (e.g., initial local mock item that wasn't stored in Supabase),
  // we do not attempt to execute a Postgres query with invalid UUID syntax.
  if (!isValidUUID(record.id)) {
    logAuthDebug('[DELETE MASTER] Record has non-UUID identifier (local mock), bypassing database delete.');
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('master_pelanggaran')
      .delete()
      .eq('id', record.id); // Strictly database UUID

    if (error) {
      console.error('[DELETE MASTER ERROR]', error);
      logAuthDebug('Error deleting master pelanggaran from Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[DELETE MASTER ERROR]', err);
    logAuthDebug('Exception deleting master pelanggaran from Supabase:', err?.message);
    return { success: false, error: err?.message || 'Gagal menghapus data dari Supabase' };
  }
}

/**
 * Delete all or batch master pelanggaran records from Supabase
 * Enforces role restriction (only KASIE_KEPESANTRENAN).
 * Strictly queries valid UUIDs.
 */
export async function deleteAllMasterPelanggaranFromDB(
  recordsToDelete: Array<{ id: string; kode?: string; jenis?: string }>,
  userRole?: UserRole
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  if (userRole !== 'KASIE_KEPESANTRENAN') {
    return { success: false, deletedCount: 0, error: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang.' };
  }

  if (recordsToDelete.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  const validUuids = recordsToDelete
    .map((r) => r.id)
    .filter((id) => isValidUUID(id));

  console.log('[DELETE ALL MASTER]', {
    totalRequested: recordsToDelete.length,
    validUuidsCount: validUuids.length,
    validUuids
  });

  if (!supabase || validUuids.length === 0) {
    return { success: true, deletedCount: recordsToDelete.length };
  }

  try {
    const { error } = await supabase
      .from('master_pelanggaran')
      .delete()
      .in('id', validUuids);

    if (error) {
      console.error('[DELETE ALL MASTER ERROR]', error);
      logAuthDebug('Error deleting batch master pelanggaran from Supabase:', error.message);
      return { success: false, deletedCount: 0, error: error.message };
    }

    return { success: true, deletedCount: recordsToDelete.length };
  } catch (err: any) {
    console.error('[DELETE ALL MASTER ERROR]', err);
    logAuthDebug('Exception batch deleting master pelanggaran from Supabase:', err?.message);
    return { success: false, deletedCount: 0, error: err?.message || 'Gagal menghapus data dari Supabase' };
  }
}

/**
 * Batch insert master pelanggaran into Supabase during Excel import
 */
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

  if (items.length === 0) {
    return { success: true, insertedData: [] };
  }

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
      id: String(row.id), // UUID from Supabase
      kode: row.kode || '',
      jenis: row.jenis || row.nama || '',
      poin: Number(row.poin) || 0,
      kategori: row.kategori || 'Sangat Ringan',
      konsekuensi: row.konsekuensi || row.hukuman || '-'
    }));

    return { success: true, insertedData: mapped };
  } catch (err: any) {
    console.error('[IMPORT MASTER BATCH ERROR]', err);
    return { success: false, error: err?.message || 'Gagal mengimpor data ke database.' };
  }
}

/**
 * Check count of violations linked to a Santri in public.pelanggaran
 */
export async function getSantriViolationsCountFromDB(santriId: string): Promise<number> {
  if (!supabase || !isValidUUID(santriId)) return 0;
  try {
    const { count, error } = await supabase
      .from('pelanggaran')
      .select('id', { count: 'exact', head: true })
      .eq('santri_id', santriId);
    if (error) {
      logAuthDebug('Notice getting santri violations count:', error.message);
      return 0;
    }
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Safely delete a Santri and optionally their child transaction records in public.pelanggaran.
 *
 * STRICT ORDER OF OPERATIONS:
 * 1. If deleteViolations is true (or violations exist):
 *    DELETE FROM public.pelanggaran WHERE santri_id = [santri.id];
 * 2. DELETE FROM public.santri WHERE id = [santri.id];
 *
 * CRITICAL INTEGRITY MANDATES:
 * - public.master_pelanggaran is MASTER data and MUST NEVER BE DELETED or touched.
 * - Only transactions for the specific santri.id are deleted.
 * - Raw database errors (UUID/FK constraint) are sanitized into clean, human-readable Indonesian messages.
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

  console.log('[DELETE SANTRI]', {
    santriId: santri.id,
    isUUID: isValidUUID(santri.id),
    nama: santri.nama,
    deleteViolations: Boolean(options.deleteViolations)
  });

  if (!supabase) {
    return { success: true, deletedViolationsCount: 0 };
  }

  // Non-UUID (e.g., initial local mock dataset) does not exist as PostgreSQL UUID in Supabase
  if (!isValidUUID(santri.id)) {
    logAuthDebug('[DELETE SANTRI] Record has non-UUID identifier (local mock), bypassing database delete.');
    return { success: true, deletedViolationsCount: 0 };
  }

  try {
    // 1. Check existing transactions in public.pelanggaran
    const { count: violationCount, error: countError } = await supabase
      .from('pelanggaran')
      .select('id', { count: 'exact', head: true })
      .eq('santri_id', santri.id);

    if (countError) {
      logAuthDebug('Notice query pelanggaran count:', countError.message);
    }

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
      logAuthDebug(`[DELETE SANTRI] Berhasil menghapus ${totalViolations} riwayat pelanggaran dari public.pelanggaran untuk santri_id: ${santri.id}`);
    }

    // 3. STEP 2: Delete parent record from public.santri
    const { error: deleteSantriError } = await supabase
      .from('santri')
      .delete()
      .eq('id', santri.id);

    if (deleteSantriError) {
      console.error('[DELETE SANTRI ERROR]', deleteSantriError);
      if (deleteSantriError.message?.toLowerCase().includes('foreign key') || deleteSantriError.message?.toLowerCase().includes('referenced')) {
        return {
          success: false,
          deletedViolationsCount: totalViolations,
          error: `Santri tidak dapat dihapus karena masih memiliki relasi data pelanggaran aktif.`
        };
      }
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


