-- Supabase SQL Script
-- Update `residents` table structure based on `tweb_penduduk` fields

ALTER TABLE public.residents
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS blood_type text,
ADD COLUMN IF NOT EXISTS citizenship text,
ADD COLUMN IF NOT EXISTS father_name text,
ADD COLUMN IF NOT EXISTS mother_name text,
ADD COLUMN IF NOT EXISTS address text;

-- (Optional) If you want to migrate data directly from `tweb_penduduk` to `residents`, you can run the following query:
-- Make sure the columns match your `tweb_penduduk` structure. OpenSID uses integer IDs for some fields.
/*
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
*/
