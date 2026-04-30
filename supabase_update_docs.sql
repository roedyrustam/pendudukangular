-- Supabase SQL Script
-- Update `residents_docs` table structure based on OpenSID's `dokumen` fields

ALTER TABLE public.residents_docs
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS is_requirement boolean DEFAULT false;

-- (Optional) If you want to migrate data directly from OpenSID `dokumen` to `residents_docs`, you can run the following query:
/*
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
    id_pend::text, -- Asumsi id_pend adalah NIK, jika tidak perlu di-JOIN dengan tweb_penduduk
    nama,
    -- Untuk URL, Anda mungkin harus membuat format URL storage bucket publik berdasarkan satuan/file
    -- CONCAT('https://zkeruxxdlisxqespemqz.supabase.co/storage/v1/object/public/dokumen/', satuan),
    '', 
    satuan, -- path atau nama file asli
    'dokumen', -- type MIME (perlu disesuaikan dengan file extension jika diperlukan)
    keterangan,
    CASE WHEN syarat_surat = 1 THEN true ELSE false END,
    COALESCE(tgl_upload::timestamp, NOW())
FROM public.dokumen
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    description = EXCLUDED.description,
    is_requirement = EXCLUDED.is_requirement;
*/
