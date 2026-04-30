-- ==========================================
-- FULL MIGRATION SCRIPT: OpenSID to DigiWarga
-- ==========================================

-- --------------------------------------------------------
-- 1. ALTER TABLES (Adding missing columns for OpenSID fields)
-- --------------------------------------------------------

-- A. Residents
ALTER TABLE public.residents
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS blood_type text,
ADD COLUMN IF NOT EXISTS citizenship text,
ADD COLUMN IF NOT EXISTS father_name text,
ADD COLUMN IF NOT EXISTS mother_name text,
ADD COLUMN IF NOT EXISTS address text;

-- B. Families
ALTER TABLE public.families
ADD COLUMN IF NOT EXISTS head_of_family_nik text,
ADD COLUMN IF NOT EXISTS rt text,
ADD COLUMN IF NOT EXISTS rw text,
ADD COLUMN IF NOT EXISTS hamlet text,
ADD COLUMN IF NOT EXISTS social_class text,
ADD COLUMN IF NOT EXISTS print_date text;

-- C. Services (Requests)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS id_surat text,
ADD COLUMN IF NOT EXISTS form_data text,
ADD COLUMN IF NOT EXISTS phone_active text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- D. Users (Profiles)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS id_grup text,
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- E. Resident Documents
ALTER TABLE public.residents_docs
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS is_requirement boolean DEFAULT false;


-- --------------------------------------------------------
-- 2. DATA MIGRATION (Insert/Update from OpenSID Tables)
-- --------------------------------------------------------

-- A. Migrate Residents (tweb_penduduk -> residents)
INSERT INTO public.residents (
    nik, 
    family_id, 
    full_name, 
    birth_place, 
    birth_date, 
    gender, 
    occupation, 
    relationship, 
    phone,
    religion,
    education,
    marital_status,
    blood_type,
    citizenship,
    father_name,
    mother_name,
    address,
    created_at
)
SELECT 
    nik, 
    id_kk::text, 
    nama, 
    tempatlahir, 
    tanggallahir::text, 
    CASE WHEN sex = '1' THEN 'Laki-laki' ELSE 'Perempuan' END, 
    pekerjaan_id::text, 
    kk_level::text, 
    telepon,
    agama_id::text,
    pendidikan_kk_id::text,
    status_kawin::text,
    golongan_darah_id::text,
    warganegara_id::text,
    nama_ayah,
    nama_ibu,
    alamat_sekarang,
    NOW()
FROM public.tweb_penduduk
ON CONFLICT (nik) DO UPDATE SET
    family_id = EXCLUDED.family_id,
    full_name = EXCLUDED.full_name,
    birth_place = EXCLUDED.birth_place,
    birth_date = EXCLUDED.birth_date,
    gender = EXCLUDED.gender,
    occupation = EXCLUDED.occupation,
    relationship = EXCLUDED.relationship,
    phone = EXCLUDED.phone,
    religion = EXCLUDED.religion,
    education = EXCLUDED.education,
    marital_status = EXCLUDED.marital_status,
    blood_type = EXCLUDED.blood_type,
    citizenship = EXCLUDED.citizenship,
    father_name = EXCLUDED.father_name,
    mother_name = EXCLUDED.mother_name,
    address = EXCLUDED.address;


-- B. Migrate Families (tweb_keluarga -> families)
INSERT INTO public.families (
    kk_number, 
    head_of_family_nik,
    head_of_family_name, 
    address, 
    rt_rw,
    rt,
    rw,
    hamlet,
    district, 
    regency, 
    province, 
    social_class,
    print_date,
    created_at
)
SELECT 
    no_kk, 
    nik_kepala, 
    COALESCE((SELECT nama FROM public.tweb_penduduk WHERE nik = public.tweb_keluarga.nik_kepala LIMIT 1), 'Kepala Keluarga'), 
    alamat, 
    CONCAT(rt, '/', rw),
    rt,
    rw,
    dusun,
    'Kecamatan Anda', -- Ganti jika tabel konfigurasi desa ada
    'Kabupaten Anda', 
    'Provinsi Anda',  
    kelas_sosial::text,
    tgl_cetak_kk::text,
    COALESCE(tgl_daftar::timestamp, NOW())
FROM public.tweb_keluarga
ON CONFLICT (kk_number) DO UPDATE SET
    head_of_family_nik = EXCLUDED.head_of_family_nik,
    head_of_family_name = EXCLUDED.head_of_family_name,
    address = EXCLUDED.address,
    rt_rw = EXCLUDED.rt_rw,
    rt = EXCLUDED.rt,
    rw = EXCLUDED.rw,
    hamlet = EXCLUDED.hamlet,
    social_class = EXCLUDED.social_class,
    print_date = EXCLUDED.print_date;


-- C. Migrate Users (user -> profiles)
INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    id_grup,
    nik,
    phone,
    displayName,
    photoURL,
    last_login,
    created_at
)
SELECT 
    id::text, 
    COALESCE(email, username || '@desa.local'), 
    CASE 
        WHEN id_grup = 1 THEN 'admin'
        WHEN id_grup = 2 THEN 'petugas'
        WHEN id_grup = 5 THEN 'warga'
        ELSE 'warga'
    END,
    id_grup::text,
    NULL,
    phone,
    nama,
    foto,
    last_login,
    created_at
FROM public.user
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    id_grup = EXCLUDED.id_grup,
    phone = EXCLUDED.phone,
    displayName = EXCLUDED.displayName,
    photoURL = EXCLUDED.photoURL,
    last_login = EXCLUDED.last_login;


-- D. Migrate Documents (dokumen -> residents_docs)
INSERT INTO public.residents_docs (
    id, 
    nik, 
    name, 
    url,
    path,
    type,
    description,
    is_requirement,
    created_at
)
SELECT 
    id::text, 
    id_pend::text, 
    nama,
    '', 
    satuan, 
    'dokumen', 
    keterangan,
    CASE WHEN syarat_surat = 1 THEN true ELSE false END,
    COALESCE(tgl_upload::timestamp, NOW())
FROM public.dokumen
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    description = EXCLUDED.description,
    is_requirement = EXCLUDED.is_requirement;


-- E. Migrate Services (permohonan_surat -> services)
INSERT INTO public.services (
    id, 
    nik, 
    service_type, 
    id_surat,
    reason, 
    form_data,
    status, 
    admin_note, 
    phone_active,
    created_at,
    updated_at
)
SELECT 
    id::text, 
    id_pemohon::text, 
    'Surat Layanan Mandiri', 
    id_surat::text,
    keterangan, 
    isian_form,
    CASE 
        WHEN status = 0 THEN 'Pending'
        WHEN status = 1 THEN 'Diproses'
        WHEN status = 2 THEN 'Selesai'
        WHEN status = 3 THEN 'Ditolak'
        ELSE 'Pending'
    END,
    keterangan,
    no_hp_aktif,
    created_at,
    updated_at
FROM public.permohonan_surat
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    admin_note = EXCLUDED.admin_note,
    updated_at = EXCLUDED.updated_at;

