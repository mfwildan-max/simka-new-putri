-- ==============================================================================
-- SIMKA.ID - MIGRATION: MASTER PEMBINAAN RESMI YAYASAN
-- Description: Menambahkan tabel master_pembinaan untuk menentukan rekomendasi
-- pembinaan berdasarkan POIN TUNGGAL pelanggaran (5-10, 11-20, 21-30, 31-34, 35-49, 50-69, 70-89, 90-99).
-- ==============================================================================

-- 1. Buat Tabel master_pembinaan jika belum ada (Safe & Idempotent)
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

-- Index untuk pencarian dinamis berbasis rentang poin tunggal
CREATE INDEX IF NOT EXISTS idx_master_pembinaan_rentang 
ON public.master_pembinaan (min_poin, max_poin) 
WHERE is_active = true;

-- 2. Optional: Tambahkan kolom referensi pembinaan pada tabel transaksi pelanggaran jika ada
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'pelanggaran'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'pelanggaran' AND column_name = 'pembinaan_tingkat'
        ) THEN
            ALTER TABLE public.pelanggaran ADD COLUMN pembinaan_tingkat VARCHAR(50);
        END IF;

        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'pelanggaran' AND column_name = 'rekomendasi_pembinaan'
        ) THEN
            ALTER TABLE public.pelanggaran ADD COLUMN rekomendasi_pembinaan JSONB DEFAULT '[]'::jsonb;
        END IF;
    END IF;
END $$;

-- 3. Seed / Upsert Data 8 Tingkat Pembinaan Resmi Yayasan
INSERT INTO public.master_pembinaan (tingkat, nama_tingkat, min_poin, max_poin, jenis_pembinaan, is_active)
VALUES
(
    1,
    'Tingkat 1',
    90,
    99,
    '[
        "Membaca istighfar 300 kali/hari selama satu pekan",
        "Menyikat dan membersihkan kamar mandi selama 14 hari",
        "Skorsing tanpa syarat",
        "Qiyamullail satu pekan (harus terkonfirmasi)",
        "Membuat surat pernyataan",
        "Mendapatkan surat peringatan",
        "Absen rutin kepada pimpinan sekolah/madrasah, Koordinator Unit Pesantren, dan/atau pihak yang ditunjuk selama minimal 14 hari",
        "Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk",
        "Tidak diizinkan keluar area pondok ketika perizinan/Kepulangan/Ahad keluar sebanyak 3 kali",
        "Digundul dan memakai pakaian khusus pelanggaran",
        "Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait"
    ]'::jsonb,
    true
),
(
    2,
    'Tingkat 2',
    70,
    89,
    '[
        "Membaca istighfar 300 kali/hari selama 3 hari",
        "Menyikat dan membersihkan kamar mandi selama 10 – 14 hari",
        "Skorsing dengan syarat",
        "Qiyamullail satu pekan (harus terkonfirmasi)",
        "Membuat surat pernyataan",
        "Mendapatkan surat peringatan",
        "Absen rutin kepada pimpinan sekolah/madrasah, Koordinator Unit Pesantren, dan/atau pihak yang ditunjuk selama minimal 10 hari",
        "Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk",
        "Tidak diizinkan keluar area pondok ketika perizinan/Kepulangan/Ahad keluar sebanyak 2 kali",
        "Digundul atau memakai pakaian khusus pelanggaran",
        "Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait"
    ]'::jsonb,
    true
),
(
    3,
    'Tingkat 3',
    50,
    69,
    '[
        "Membaca istighfar 700 kali",
        "Menyikat dan membersihkan kamar mandi selama 5 – 9 hari",
        "Skorsing dengan syarat",
        "Qiyamullail satu pekan (harus terkonfirmasi)",
        "Membuat surat pernyataan",
        "Mendapatkan surat peringatan",
        "Absen rutin kepada pimpinan sekolah/madrasah, Koordinator Unit Pesantren, dan/atau pihak yang ditunjuk selama minimal 5 hari",
        "Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk",
        "Tidak diizinkan keluar area pondok ketika perizinan/Kepulangan/Ahad keluar sebanyak 1 kali",
        "Gundul atau memakai pakaian pelanggaran",
        "Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait"
    ]'::jsonb,
    true
),
(
    4,
    'Tingkat 4',
    35,
    49,
    '[
        "Membaca istighfar 500 kali",
        "Menyikat dan membersihkan kamar mandi selama 3 – 7 hari",
        "Skorsing dengan syarat",
        "Qiyamullail tiga malam (harus terkonfirmasi)",
        "Membuat surat pernyataan",
        "Mendapatkan surat peringatan",
        "Absen rutin kepada pimpinan sekolah/madrasah, Koordinator Unit Pesantren, dan/atau pihak yang ditunjuk selama minimal 3 hari",
        "Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk",
        "Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait"
    ]'::jsonb,
    true
),
(
    5,
    'Tingkat 5',
    31,
    34,
    '[
        "Membaca istighfar sebanyak 300 kali",
        "Menyikat dan membersihkan kamar mandi selama 1 hari",
        "Menulis ulang ayat/hadits sejumlah yang ditentukan dan menghafalnya atau mendapatkan penugasan praktik dan/atau tertulis terkait pelanggaran yang dilakukan",
        "Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk",
        "Tidak mengulangi kesalahan serupa selama minimal 4 pekan",
        "Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait"
    ]'::jsonb,
    true
),
(
    6,
    'Tingkat 6',
    21,
    30,
    '[
        "Membaca istighfar sebanyak 200 kali",
        "Menyapu dan mengepel lantai selama 3 hari",
        "Menulis ulang ayat/hadits sejumlah yang ditentukan dan menghafalnya atau mendapatkan penugasan praktik dan/atau tertulis terkait pelanggaran yang dilakukan",
        "Meminta nasihat dan tanda tangan asatiz, pengurus, dan/atau pihak yang ditunjuk",
        "Tidak mengulangi kesalahan serupa selama minimal 2 pekan",
        "Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait"
    ]'::jsonb,
    true
),
(
    7,
    'Tingkat 7',
    11,
    20,
    '[
        "Membaca istighfar sehari 100 kali",
        "Menyapu dan mengepel lantai selama 1 hari",
        "Menghafal ayat/hadits atau mendapatkan penugasan tertulis terkait pelanggaran yang dilakukan",
        "Tidak mengulangi kesalahan serupa selama minimal 1 pekan",
        "Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait"
    ]'::jsonb,
    true
),
(
    8,
    'Tingkat 8',
    5,
    10,
    '[
        "Membaca istighfar 33 kali",
        "Menyiram tanaman di sekitar sekolah/pesantren",
        "Menghafal mufradat dan disetorkan/mendapatkan penugasan tertulis berkaitan dengan pelanggaran yang dilakukan",
        "Tidak mengulangi kesalahan yang sama selama minimal 3 hari",
        "Dan/atau pembinaan lainnya sesuai keputusan yang ditetapkan pihak-pihak terkait"
    ]'::jsonb,
    true
)
ON CONFLICT (tingkat) DO UPDATE SET
    nama_tingkat = EXCLUDED.nama_tingkat,
    min_poin = EXCLUDED.min_poin,
    max_poin = EXCLUDED.max_poin,
    jenis_pembinaan = EXCLUDED.jenis_pembinaan,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Enable Row Level Security (RLS)
ALTER TABLE public.master_pembinaan ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active coaching rules
DROP POLICY IF EXISTS "Allow read access to master_pembinaan" ON public.master_pembinaan;
CREATE POLICY "Allow read access to master_pembinaan" 
ON public.master_pembinaan 
FOR SELECT 
USING (true);
