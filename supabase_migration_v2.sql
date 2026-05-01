-- DigiWarga Royal Azure v2.0 - Database Migration
-- Target: Supabase / PostgreSQL

-- 1. Create Families Table
CREATE TABLE IF NOT EXISTS families (
    kk_number TEXT PRIMARY KEY,
    head_of_family_nik TEXT,
    head_of_family_name TEXT NOT NULL,
    address TEXT NOT NULL,
    rt_rw TEXT,
    rt TEXT,
    rw TEXT,
    hamlet TEXT,
    district TEXT NOT NULL,
    regency TEXT NOT NULL,
    province TEXT NOT NULL,
    social_class TEXT DEFAULT 'Sedang',
    print_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Residents Table
CREATE TABLE IF NOT EXISTS residents (
    nik TEXT PRIMARY KEY,
    family_id TEXT REFERENCES families(kk_number) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    birth_place TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    occupation TEXT,
    relationship TEXT,
    phone TEXT,
    religion TEXT,
    education TEXT,
    marital_status TEXT,
    blood_type TEXT,
    citizenship TEXT DEFAULT 'WNI',
    father_name TEXT,
    mother_name TEXT,
    address TEXT,
    status_dasar TEXT DEFAULT 'HIDUP' CHECK (status_dasar IN ('HIDUP', 'MATI', 'PINDAH')),
    hamlet TEXT,
    rt TEXT,
    rw TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik TEXT REFERENCES residents(nik) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    id_surat TEXT,
    reason TEXT,
    form_data JSONB,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Diproses', 'Selesai', 'Ditolak')),
    admin_note TEXT,
    attachments TEXT[],
    letter_url TEXT,
    phone_active TEXT,
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create App Users Table (Extending Auth.Users)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'warga' CHECK (role IN ('admin', 'petugas', 'warga')),
    nik TEXT REFERENCES residents(nik) ON DELETE SET NULL,
    phone TEXT,
    display_name TEXT,
    photo_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Village Config Table
CREATE TABLE IF NOT EXISTS village_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_code TEXT NOT NULL,
    province_name TEXT NOT NULL,
    regency_code TEXT NOT NULL,
    regency_name TEXT NOT NULL,
    district_code TEXT NOT NULL,
    district_name TEXT NOT NULL,
    village_code TEXT NOT NULL,
    village_name TEXT NOT NULL,
    village_head TEXT,
    village_head_nip TEXT,
    village_secretary TEXT,
    zip_code TEXT,
    village_address TEXT,
    village_phone TEXT,
    village_email TEXT,
    village_logo_url TEXT,
    idm_status TEXT,
    idm_score NUMERIC,
    dana_desa NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    caption TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_headline BOOLEAN DEFAULT FALSE,
    category_id INTEGER,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    hit_count INTEGER DEFAULT 0,
    source TEXT,
    source_url TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create APBDes Table
CREATE TABLE IF NOT EXISTS apbdes (
    id BIGSERIAL PRIMARY KEY,
    category_id INTEGER,
    article_id BIGINT REFERENCES articles(id) ON DELETE SET NULL,
    type INTEGER NOT NULL, -- 1: Income, 2: Expense, 3: Financing
    budget_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    year INTEGER NOT NULL,
    phase TEXT,
    coordinator TEXT,
    bar_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code TEXT UNIQUE NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    unit TEXT,
    condition TEXT CHECK (condition IN ('Good', 'Fair', 'Damaged')),
    location TEXT,
    procurement_year INTEGER,
    price NUMERIC,
    source TEXT,
    image_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Setup Indexes for Performance
CREATE INDEX idx_residents_family_id ON residents(family_id);
CREATE INDEX idx_residents_full_name ON residents(full_name);
CREATE INDEX idx_service_requests_nik ON service_requests(nik);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_apbdes_year ON apbdes(year);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apbdes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Public View for Read-only data)
CREATE POLICY "Public articles are viewable by everyone" ON articles FOR SELECT USING (is_enabled = true);
CREATE POLICY "Village config is viewable by everyone" ON village_config FOR SELECT USING (true);
CREATE POLICY "APBDes is viewable by everyone" ON apbdes FOR SELECT USING (true);

-- Authenticated Policies (Only for Logged-in users)
CREATE POLICY "Users can view their own profile" ON app_users FOR SELECT USING (auth.uid() = id);
-- Warga can view their own service requests - fix: use auth.jwt() to check nik claim or join with app_users
CREATE POLICY "Warga can view their own service requests" ON service_requests FOR SELECT USING (
    auth.uid() IN (SELECT id FROM app_users WHERE nik = service_requests.nik)
);

-- Admin/Petugas Policies (Elevated Access)
CREATE POLICY "Admins can manage all data" ON residents FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'petugas'))
);
CREATE POLICY "Admins can manage all families" ON families FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'petugas'))
);

-- Realtime Configuration
ALTER PUBLICATION supabase_realtime ADD TABLE residents;
ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE families;
ALTER PUBLICATION supabase_realtime ADD TABLE app_users;
