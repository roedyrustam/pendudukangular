-- Supabase SQL Script
-- Update `families` table structure based on `tweb_keluarga` fields

ALTER TABLE public.families
ADD COLUMN IF NOT EXISTS head_of_family_nik text,
ADD COLUMN IF NOT EXISTS rt text,
ADD COLUMN IF NOT EXISTS rw text,
ADD COLUMN IF NOT EXISTS hamlet text,
ADD COLUMN IF NOT EXISTS social_class text,
ADD COLUMN IF NOT EXISTS print_date text;

-- (Optional) If you want to migrate data directly from `tweb_keluarga` to `families`, you can run the following query:
/*
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
    -- Assuming you have access to the name of the head of family, or you can join with tweb_penduduk
    -- For now, placing a placeholder or leaving it to be updated if tweb_keluarga doesn't store the name directly
    'Nama Kepala Keluarga (Update via Join)', 
    alamat, 
    CONCAT(rt, '/', rw),
    rt,
    rw,
    dusun,
    'Kecamatan Anda', -- Replace with actual if available, usually OpenSID stores this in config
    'Kabupaten Anda', -- Replace with actual
    'Provinsi Anda',  -- Replace with actual
    kelas_sosial::text,
    tgl_cetak_kk::text,
    COALESCE(tgl_daftar::timestamp, NOW())
FROM public.tweb_keluarga
ON CONFLICT (kk_number) DO UPDATE SET
    head_of_family_nik = EXCLUDED.head_of_family_nik,
    address = EXCLUDED.address,
    rt_rw = EXCLUDED.rt_rw,
    rt = EXCLUDED.rt,
    rw = EXCLUDED.rw,
    hamlet = EXCLUDED.hamlet,
    social_class = EXCLUDED.social_class,
    print_date = EXCLUDED.print_date;
*/
