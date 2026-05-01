-- Supabase SQL Script
-- Update `services` table structure based on OpenSID's `permohonan_surat` fields

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS id_surat text,
ADD COLUMN IF NOT EXISTS form_data text,
ADD COLUMN IF NOT EXISTS phone_active text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- (Optional) If you want to migrate data directly from `permohonan_surat` to `services`, you can run the following query:
/*
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
    id_pemohon::text, -- Asumsikan id_pemohon di OpenSID adalah NIK, atau lakukan JOIN ke tweb_penduduk jika berupa ID
    'Surat Layanan Mandiri', -- Bisa di JOIN dengan tweb_surat_format untuk mendapatkan nama surat
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
*/
