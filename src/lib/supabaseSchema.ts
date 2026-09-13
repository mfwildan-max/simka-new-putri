// ==============================================================================
// SIMKA.ID - SKEMA SQL SUPABASE RESMI & LENGKAP
// Salin skrip ini dan jalankan langsung di menu SQL Editor pada Dashboard Supabase.
// ==============================================================================

export const COMPLETE_SUPABASE_SQL = `-- ==============================================================================
-- SIMKA.ID - MASTER DATABASE SETUP SCRIPT (POSTGRESQL / SUPABASE)
-- Sistem Manajemen Kedisiplinan & Karakter Santri
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABEL USERS (Autentikasi Mandiri SIMKA.ID)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT 'usr-' || substr(md5(random()::text), 1, 8),
  nama TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MUSYRIF', 'KOORDINATOR', 'KASIE_KEPESANTRENAN')),
  unit TEXT NOT NULL CHECK (unit IN ('SMP', 'MA', 'SMA', 'ALL')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  email TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_unit_role ON public.users(unit, role);

-- 3. TABEL SANTRI
CREATE TABLE IF NOT EXISTS public.santri (
  id TEXT PRIMARY KEY DEFAULT 's-' || substr(md5(random()::text), 1, 8),
  kode_santri TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('SMP', 'MA', 'SMA')),
  musyrif_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  musyrif_nama TEXT,
  asrama TEXT,
  kamar TEXT,
  total_poin INTEGER NOT NULL DEFAULT 0,
  status_pembinaan TEXT DEFAULT 'Baik',
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_santri_unit ON public.santri(unit);
CREATE INDEX IF NOT EXISTS idx_santri_musyrif ON public.santri(musyrif_id);

-- 4. TABEL MASTER PELANGGARAN
CREATE TABLE IF NOT EXISTS public.master_pelanggaran (
  id TEXT PRIMARY KEY DEFAULT 'p-' || substr(md5(random()::text), 1, 8),
  kode TEXT NOT NULL UNIQUE,
  jenis TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('Ringan', 'Sedang', 'Berat')),
  poin INTEGER NOT NULL CHECK (poin > 0),
  konsekuensi TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL TRANSAKSI PELANGGARAN / RIWAYAT
CREATE TABLE IF NOT EXISTS public.pelanggaran (
  id TEXT PRIMARY KEY DEFAULT 'log-' || substr(md5(random()::text), 1, 8),
  santri_id TEXT NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  santri_unit TEXT NOT NULL CHECK (santri_unit IN ('SMP', 'MA', 'SMA')),
  jenis_pelanggaran_id TEXT REFERENCES public.master_pelanggaran(id),
  jenis_pelanggaran_nama TEXT NOT NULL,
  poin INTEGER NOT NULL CHECK (poin > 0),
  hukuman TEXT,
  status TEXT NOT NULL DEFAULT 'Belum Selesai' CHECK (status IN ('Belum Selesai', 'Selesai')),
  catatan TEXT,
  pencatat_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  pencatat_nama TEXT NOT NULL,
  pembinaan_tingkat VARCHAR(50),
  rekomendasi_pembinaan JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pelanggaran_santri ON public.pelanggaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_unit ON public.pelanggaran(santri_unit);

-- 6. TABEL MASTER PEMBINAAN (8 Tingkat Resmi Yayasan)
CREATE TABLE IF NOT EXISTS public.master_pembinaan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tingkat INTEGER NOT NULL UNIQUE,
  nama_tingkat VARCHAR(50) NOT NULL,
  min_poin INTEGER NOT NULL,
  max_poin INTEGER NOT NULL,
  jenis_pembinaan JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABEL TINDAK LANJUT PEMBINAAN
CREATE TABLE IF NOT EXISTS public.pembinaan (
  id TEXT PRIMARY KEY DEFAULT 'pem-' || substr(md5(random()::text), 1, 8),
  santri_id TEXT NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  santri_nama TEXT NOT NULL,
  santri_kelas TEXT NOT NULL,
  santri_unit TEXT NOT NULL,
  pelanggaran_terkait_id TEXT REFERENCES public.pelanggaran(id) ON DELETE SET NULL,
  pelanggaran_terkait_jenis TEXT,
  jenis_pembinaan TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  tanggal_target_selesai TEXT,
  pembina TEXT NOT NULL,
  pembina_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  catatan TEXT,
  status TEXT NOT NULL DEFAULT 'BELUM DIMULAI',
  tanggal_selesai TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) - DIIZINKAN UNTUK ANON PUBLIC KEY
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_pembinaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembinaan ENABLE ROW LEVEL SECURITY;

-- Buat Policy Akses Penuh untuk Anon Key
DROP POLICY IF EXISTS "Public Anon All users" ON public.users;
CREATE POLICY "Public Anon All users" ON public.users FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon All santri" ON public.santri;
CREATE POLICY "Public Anon All santri" ON public.santri FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon All master_pelanggaran" ON public.master_pelanggaran;
CREATE POLICY "Public Anon All master_pelanggaran" ON public.master_pelanggaran FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon All pelanggaran" ON public.pelanggaran;
CREATE POLICY "Public Anon All pelanggaran" ON public.pelanggaran FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon All master_pembinaan" ON public.master_pembinaan;
CREATE POLICY "Public Anon All master_pembinaan" ON public.master_pembinaan FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon All pembinaan" ON public.pembinaan;
CREATE POLICY "Public Anon All pembinaan" ON public.pembinaan FOR ALL TO anon USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. SEED DATA DEFAULT (AKUN DEFAULT & MASTER PEMBINAAN)
-- ==============================================================================

-- Akun Default (Password: admin123 untuk kasie, smp123 / ma123 / sma123)
-- SHA-256 hash
INSERT INTO public.users (id, nama, username, password_hash, role, unit, is_active, email, title)
VALUES 
  ('usr-kasie-01', 'Ustadz Abdullah, Lc.', 'kasie', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'KASIE_KEPESANTRENAN', 'ALL', true, 'kasie@simka.id', 'Kepala Seksi Kepesantrenan'),
  ('usr-koord-smp', 'Ustadz Ahmad Fauzi, S.Pd.I', 'koordinator_smp', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'KOORDINATOR', 'SMP', true, 'koord.smp@simka.id', 'Koordinator Kedisiplinan SMP'),
  ('usr-koord-ma', 'Ustadz Ridwan Kamil, M.Pd.', 'koordinator_ma', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'KOORDINATOR', 'MA', true, 'koord.ma@simka.id', 'Koordinator Kedisiplinan MA'),
  ('usr-koord-sma', 'Ustadz Hasan Basri, S.Kom.I', 'koordinator_sma', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'KOORDINATOR', 'SMA', true, 'koord.sma@simka.id', 'Koordinator Kedisiplinan SMA'),
  ('usr-musy-smp-01', 'Ust. Salman Al-Farisi (SMP)', 'musyrif_smp1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'MUSYRIF', 'SMP', true, 'musyrif.smp1@simka.id', 'Musyrif Asrama SMP'),
  ('usr-musy-ma-01', 'Ust. Bilal bin Rabah (MA)', 'musyrif_ma1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'MUSYRIF', 'MA', true, 'musyrif.ma1@simka.id', 'Musyrif Asrama MA'),
  ('usr-musy-sma-01', 'Ust. Khalid bin Walid (SMA)', 'musyrif_sma1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'MUSYRIF', 'SMA', true, 'musyrif.sma1@simka.id', 'Musyrif Asrama SMA')
ON CONFLICT (username) DO NOTHING;

-- Master 8 Tingkat Pembinaan Resmi
INSERT INTO public.master_pembinaan (tingkat, nama_tingkat, min_poin, max_poin, jenis_pembinaan, is_active)
VALUES
(1, 'Tingkat 1', 90, 99, '["Membaca istighfar 300 kali/hari selama satu pekan", "Menyikat dan membersihkan kamar mandi selama 14 hari", "Skorsing tanpa syarat", "Qiyamullail satu pekan (harus terkonfirmasi)", "Membuat surat pernyataan", "Mendapatkan surat peringatan", "Absen rutin kepada pimpinan selama minimal 14 hari", "Meminta nasihat dan tanda tangan asatiz", "Tidak diizinkan keluar area pondok sebanyak 3 kali", "Digundul dan memakai pakaian khusus pelanggaran"]'::jsonb, true),
(2, 'Tingkat 2', 70, 89, '["Membaca istighfar 300 kali/hari selama 3 hari", "Menyikat dan membersihkan kamar mandi selama 10 – 14 hari", "Skorsing dengan syarat", "Qiyamullail satu pekan", "Membuat surat pernyataan", "Mendapatkan surat peringatan", "Absen rutin selama minimal 10 hari", "Meminta nasihat dan tanda tangan asatiz", "Tidak diizinkan keluar area pondok sebanyak 2 kali"]'::jsonb, true),
(3, 'Tingkat 3', 50, 69, '["Membaca istighfar 700 kali", "Menyikat dan membersihkan kamar mandi selama 5 – 9 hari", "Skorsing dengan syarat", "Qiyamullail satu pekan", "Membuat surat pernyataan", "Mendapatkan surat peringatan", "Absen rutin selama minimal 7 hari", "Meminta nasihat dan tanda tangan asatiz", "Tidak diizinkan keluar area pondok sebanyak 1 kali"]'::jsonb, true),
(4, 'Tingkat 4', 35, 49, '["Membaca istighfar 500 kali", "Menyikat dan membersihkan kamar mandi selama 3 – 5 hari", "Qiyamullail 3 hari berturut-turut", "Membuat surat pernyataan", "Mendapatkan surat peringatan", "Absen rutin selama minimal 5 hari", "Meminta nasihat dan tanda tangan asatiz"]'::jsonb, true),
(5, 'Tingkat 5', 31, 34, '["Membaca istighfar 400 kali", "Menyikat dan membersihkan kamar mandi selama 1 – 3 hari", "Qiyamullail 1 hari", "Membuat surat pernyataan", "Mendapatkan surat peringatan", "Absen rutin selama minimal 3 hari", "Meminta nasihat dan tanda tangan asatiz"]'::jsonb, true),
(6, 'Tingkat 6', 21, 30, '["Membaca istighfar 300 kali", "Qiyamullail 1 hari", "Membersihkan area asrama/sekolah 1 – 3 hari", "Membuat surat pernyataan", "Mendapatkan surat peringatan", "Meminta nasihat dan tanda tangan asatiz"]'::jsonb, true),
(7, 'Tingkat 7', 11, 20, '["Membaca istighfar 200 kali", "Membersihkan area asrama/sekolah 1 – 2 hari", "Teguran dan nasihat dari musyrif", "Membuat surat pernyataan"]'::jsonb, true),
(8, 'Tingkat 8', 5, 10, '["Membaca istighfar 100 kali", "Teguran lisan langsung dari musyrif", "Nasihat perbaikan adab"]'::jsonb, true)
ON CONFLICT (tingkat) DO NOTHING;
`;
