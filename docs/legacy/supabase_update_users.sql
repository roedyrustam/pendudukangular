-- Supabase SQL Script
-- Update `users` table structure based on OpenSID's `user` fields

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS id_grup text,
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- (Optional) If you want to migrate data directly from OpenSID `user` to `profiles`, you can run the following query:
/*
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
    COALESCE(email, username || '@desa.local'), -- Use username as mock email if email is empty
    CASE 
        WHEN id_grup = 1 THEN 'admin'
        WHEN id_grup = 2 THEN 'petugas'
        WHEN id_grup = 5 THEN 'warga'
        ELSE 'warga'
    END,
    id_grup::text,
    NULL, -- NIK is usually not in the admin user table directly unless linked
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
*/
