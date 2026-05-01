-- Supabase SQL Script
-- Create `village_config` table for village/desa configuration

CREATE TABLE IF NOT EXISTS public.village_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  province_code text NOT NULL,
  province_name text NOT NULL,
  regency_code text NOT NULL,
  regency_name text NOT NULL,
  district_code text NOT NULL,
  district_name text NOT NULL,
  village_code text NOT NULL,
  village_name text NOT NULL,
  village_head text,
  village_address text,
  village_phone text,
  village_email text,
  village_logo_url text,
  updated_at timestamp with time zone DEFAULT NOW(),
  created_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.village_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON public.village_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated write" ON public.village_config
  FOR ALL USING (auth.role() = 'authenticated');
