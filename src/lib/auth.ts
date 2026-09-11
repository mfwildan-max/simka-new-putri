import { UserRole, UnitPesantren, UserAccount, PageRoute } from '../types';

const SALT = 'simka_secure_salt_v2_2026';

/**
 * Computes a standard SHA-256 hash with salt for secure password hashing.
 * Works seamlessly in all modern browsers and Node environments.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Synchronous hash helper for deterministic offline storage
 */
export function hashPasswordSync(password: string): string {
  let hash = 0;
  const str = password + SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'sh256_' + Math.abs(hash).toString(16) + '_simka';
}

/**
 * Robust multi-format password verification:
 * - SHA-256 with project salt
 * - SHA-256 raw hex (unsalted)
 * - Deterministic sync hash
 * - Plaintext fallback for legacy/testing DB
 */
export async function verifyPassword(inputPassword: string, storedHashOrPlain: string): Promise<boolean> {
  if (!inputPassword || !storedHashOrPlain) return false;

  // 1. Direct match (plain text fallback if stored unhashed)
  if (storedHashOrPlain === inputPassword) return true;

  // 2. Standard SHA-256 with project salt
  try {
    const saltedHash = await hashPassword(inputPassword);
    if (storedHashOrPlain.toLowerCase() === saltedHash.toLowerCase()) return true;
  } catch (e) {
    // continue
  }

  // 3. Deterministic sync hash
  const syncHash = hashPasswordSync(inputPassword);
  if (storedHashOrPlain === syncHash) return true;

  // 4. Raw SHA-256 (no salt)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(inputPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const rawHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (storedHashOrPlain.toLowerCase() === rawHex.toLowerCase()) return true;
  } catch (e) {
    // continue
  }

  return false;
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'MUSYRIF':
      return 'Musyrif';
    case 'KOORDINATOR':
      return 'Koordinator';
    case 'KASIE_KEPESANTRENAN':
      return 'Kasie Kepesantrenan / Kabid';
    default:
      return role;
  }
}

export function getUnitDisplayName(unit: 'ALL' | UnitPesantren): string {
  switch (unit) {
    case 'SMP':
      return 'Unit SMP';
    case 'MA':
      return 'Unit MA';
    case 'SMA':
      return 'Unit SMA';
    case 'ALL':
      return 'Semua Unit (Global)';
    default:
      return unit;
  }
}

/**
 * Verifies if a given user role has permission to access a specific page route.
 */
export function canRoleAccessRoute(role: UserRole, route: PageRoute): boolean {
  if (route === 'login' || route === 'akun') {
    return true;
  }

  switch (role) {
    case 'MUSYRIF':
      return (
        route === 'data-santri' ||
        route === 'catat-pelanggaran' ||
        route === 'rekap-pelanggaran' ||
        route === 'data-pembinaan' ||
        route === 'riwayat-pembinaan'
      );

    case 'KOORDINATOR':
      return (
        route === 'dashboard' ||
        route === 'data-santri' ||
        route === 'catat-pelanggaran' ||
        route === 'rekap-pelanggaran' ||
        route === 'data-pembinaan' ||
        route === 'riwayat-pembinaan' ||
        route === 'laporan-pembinaan'
      );

    case 'KASIE_KEPESANTRENAN':
      // Superadmin can access everything
      return true;

    default:
      return false;
  }
}

/**
 * Returns default landing page for a role after successful login
 */
export function getDefaultRouteForRole(role: UserRole): PageRoute {
  switch (role) {
    case 'MUSYRIF':
      return 'data-santri';
    case 'KOORDINATOR':
    case 'KASIE_KEPESANTRENAN':
    default:
      return 'dashboard';
  }
}
