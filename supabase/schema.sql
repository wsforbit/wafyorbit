-- ==============================================================================
-- WAFY ORBIT DATABASE SCHEMA & MIGRATION SCRIPT
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'leader', 'college');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Colleges Table (affno is the sole primary key identifier)
CREATE TABLE IF NOT EXISTS public.colleges (
    affno TEXT PRIMARY KEY, -- Unique Affiliation Number (e.g. WASC01, AFF101)
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    place TEXT NOT NULL,
    district TEXT,
    state TEXT NOT NULL DEFAULT 'Kerala',
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Orbits Table (id as primary identifier)
CREATE TABLE IF NOT EXISTS public.orbits (
    id TEXT PRIMARY KEY, -- Unique Orbit ID (e.g. ORB101, ORB-CALICUT)
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    state TEXT NOT NULL DEFAULT 'Kerala',
    district TEXT NOT NULL,
    taluk TEXT NOT NULL,
    constituency TEXT,
    panchayaths TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Students Table (cicno is the sole primary key identifier)
CREATE TABLE IF NOT EXISTS public.students (
    cicno TEXT PRIMARY KEY, -- Unique Student Identifier (e.g. CIC2025001)
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    place TEXT NOT NULL,
    panchayath TEXT,
    pin_code TEXT,
    phone TEXT,
    whatsapp TEXT,
    g_phone TEXT, -- Guardian Phone Number
    role TEXT NOT NULL DEFAULT 'member', -- Auto assigned role as member
    orbit_id TEXT REFERENCES public.orbits(id) ON DELETE SET NULL, -- Nullable
    affno TEXT REFERENCES public.colleges(affno) ON DELETE SET NULL, -- Connected College ID (Nullable)
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Graduated', 'Suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Orbit Leaders Table
CREATE TABLE IF NOT EXISTS public.orbit_leaders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL REFERENCES public.students(cicno) ON DELETE CASCADE,
    orbit_id TEXT NOT NULL REFERENCES public.orbits(id) ON DELETE CASCADE,
    position_title TEXT NOT NULL DEFAULT 'Leader',
    term_year TEXT NOT NULL DEFAULT '2025-2026',
    appointed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6b. District Leaders Table (1 Leader per Active District)
CREATE TABLE IF NOT EXISTS public.district_leaders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district TEXT NOT NULL UNIQUE,
    student_id TEXT NOT NULL REFERENCES public.students(cicno) ON DELETE CASCADE,
    position_title TEXT NOT NULL DEFAULT 'District Leader',
    term_year TEXT NOT NULL DEFAULT '2025-2026',
    appointed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6c. Constituency Leaders Table (1 Leader per Malappuram Constituency)
CREATE TABLE IF NOT EXISTS public.constituency_leaders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district TEXT NOT NULL DEFAULT 'Malappuram',
    constituency TEXT NOT NULL UNIQUE,
    student_id TEXT NOT NULL REFERENCES public.students(cicno) ON DELETE CASCADE,
    position_title TEXT NOT NULL DEFAULT 'Constituency Leader',
    term_year TEXT NOT NULL DEFAULT '2025-2026',
    appointed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'college',
    assigned_orbit_id TEXT REFERENCES public.orbits(id) ON DELETE SET NULL,
    assigned_college_id TEXT REFERENCES public.colleges(affno) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- CLEANUP MIGRATION FOR EXISTING DATABASES
-- Run this in Supabase SQL Editor to drop removed columns safely:
-- ==============================================================================
-- ALTER TABLE public.colleges DROP COLUMN IF EXISTS id CASCADE;
-- ALTER TABLE public.students DROP COLUMN IF EXISTS batch_year CASCADE;
-- ALTER TABLE public.students DROP COLUMN IF EXISTS district CASCADE;
-- ALTER TABLE public.students DROP COLUMN IF EXISTS admission_no CASCADE;
-- ALTER TABLE public.students DROP COLUMN IF EXISTS full_name CASCADE;
-- ALTER TABLE public.students DROP COLUMN IF EXISTS college_id CASCADE;
-- ALTER TABLE public.students DROP COLUMN IF EXISTS id CASCADE;

-- ==============================================================================
-- AUTOMATIC PROFILE TRIGGER ON AUTH USER CREATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        assigned_orbit_id,
        assigned_college_id
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'admin'::user_role),
        NEW.raw_user_meta_data->>'assigned_orbit_id',
        NEW.raw_user_meta_data->>'assigned_college_id'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = COALESCE(EXCLUDED.role, profiles.role),
        assigned_orbit_id = COALESCE(EXCLUDED.assigned_orbit_id, profiles.assigned_orbit_id),
        assigned_college_id = COALESCE(EXCLUDED.assigned_college_id, profiles.assigned_college_id),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (FULL CRUD PERMISSIONS)
-- ==============================================================================
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orbits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orbit_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constituency_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Colleges
DROP POLICY IF EXISTS "Public can view colleges" ON public.colleges;
DROP POLICY IF EXISTS "Enable all access for colleges" ON public.colleges;
CREATE POLICY "Enable all access for colleges" ON public.colleges FOR ALL USING (true) WITH CHECK (true);

-- Orbits
DROP POLICY IF EXISTS "Public can view orbits" ON public.orbits;
DROP POLICY IF EXISTS "Enable all access for orbits" ON public.orbits;
CREATE POLICY "Enable all access for orbits" ON public.orbits FOR ALL USING (true) WITH CHECK (true);

-- Students
DROP POLICY IF EXISTS "Public can view students" ON public.students;
DROP POLICY IF EXISTS "Enable all access for students" ON public.students;
CREATE POLICY "Enable all access for students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- Orbit Leaders
DROP POLICY IF EXISTS "Public can view leaders" ON public.orbit_leaders;
DROP POLICY IF EXISTS "Enable all access for leaders" ON public.orbit_leaders;
CREATE POLICY "Enable all access for leaders" ON public.orbit_leaders FOR ALL USING (true) WITH CHECK (true);

-- District Leaders
DROP POLICY IF EXISTS "Public can view district leaders" ON public.district_leaders;
DROP POLICY IF EXISTS "Enable all access for district leaders" ON public.district_leaders;
CREATE POLICY "Enable all access for district leaders" ON public.district_leaders FOR ALL USING (true) WITH CHECK (true);

-- Constituency Leaders
DROP POLICY IF EXISTS "Public can view constituency leaders" ON public.constituency_leaders;
DROP POLICY IF EXISTS "Enable all access for constituency leaders" ON public.constituency_leaders;
CREATE POLICY "Enable all access for constituency leaders" ON public.constituency_leaders FOR ALL USING (true) WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for profiles" ON public.profiles;
CREATE POLICY "Enable all access for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
