-- ==============================================================================
-- WAFY ORBIT: 16 CONSTITUENCY & 17 DISTRICT AUTH ACCOUNTS MIGRATION
-- Run this in the Supabase SQL Editor if you wish to run/audit in PostgreSQL directly.
-- ==============================================================================

-- 1. Optional schema updates
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'district';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'constituency';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_district TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_constituency TEXT;

-- 2. Auth Users & Profiles Provisioning Script
DO $$
DECLARE
    uid uuid;
BEGIN

    -- --------------------------------------------------------------------------
    -- 16 MALAPPURAM CONSTITUENCY AUTH ACCOUNTS (Format: c_{name}@orbit.com / const{count})
    -- --------------------------------------------------------------------------

    -- Kondotty (Active: 5)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_kondotty@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_kondotty@orbit.com', crypt('const5', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Kondotty","full_name":"Kondotty Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const5', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Kondotty"}'::jsonb WHERE email = 'c_kondotty@orbit.com';
    END IF;

    -- Eranad (Active: 2)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_eranad@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_eranad@orbit.com', crypt('const2', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Eranad","full_name":"Eranad Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const2', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Eranad"}'::jsonb WHERE email = 'c_eranad@orbit.com';
    END IF;

    -- Nilambur (Active: 2)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_nilambur@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_nilambur@orbit.com', crypt('const2', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Nilambur","full_name":"Nilambur Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const2', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Nilambur"}'::jsonb WHERE email = 'c_nilambur@orbit.com';
    END IF;

    -- Wandoor (Active: 3)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_wandoor@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_wandoor@orbit.com', crypt('const3', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Wandoor","full_name":"Wandoor Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const3', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Wandoor"}'::jsonb WHERE email = 'c_wandoor@orbit.com';
    END IF;

    -- Manjeri (Active: 3)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_manjeri@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_manjeri@orbit.com', crypt('const3', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Manjeri","full_name":"Manjeri Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const3', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Manjeri"}'::jsonb WHERE email = 'c_manjeri@orbit.com';
    END IF;

    -- Perinthalmanna (Active: 6)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_perinthalmanna@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_perinthalmanna@orbit.com', crypt('const6', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Perinthalmanna","full_name":"Perinthalmanna Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const6', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Perinthalmanna"}'::jsonb WHERE email = 'c_perinthalmanna@orbit.com';
    END IF;

    -- Mankada (Active: 3)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_mankada@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_mankada@orbit.com', crypt('const3', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Mankada","full_name":"Mankada Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const3', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Mankada"}'::jsonb WHERE email = 'c_mankada@orbit.com';
    END IF;

    -- Malappuram (Active: 5)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_malappuram@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_malappuram@orbit.com', crypt('const5', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Malappuram","full_name":"Malappuram Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const5', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Malappuram"}'::jsonb WHERE email = 'c_malappuram@orbit.com';
    END IF;

    -- Vengara (Active: 4)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_vengara@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_vengara@orbit.com', crypt('const4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Vengara","full_name":"Vengara Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const4', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Vengara"}'::jsonb WHERE email = 'c_vengara@orbit.com';
    END IF;

    -- Vallikkunnu (Active: 2)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_vallikkunnu@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_vallikkunnu@orbit.com', crypt('const2', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Vallikkunnu","full_name":"Vallikkunnu Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const2', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Vallikkunnu"}'::jsonb WHERE email = 'c_vallikkunnu@orbit.com';
    END IF;

    -- Tirurangadi (Active: 4)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_tirurangadi@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_tirurangadi@orbit.com', crypt('const4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Tirurangadi","full_name":"Tirurangadi Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const4', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Tirurangadi"}'::jsonb WHERE email = 'c_tirurangadi@orbit.com';
    END IF;

    -- Tanur (Active: 3)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_tanur@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_tanur@orbit.com', crypt('const3', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Tanur","full_name":"Tanur Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const3', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Tanur"}'::jsonb WHERE email = 'c_tanur@orbit.com';
    END IF;

    -- Tirur (Active: 3)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_tirur@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_tirur@orbit.com', crypt('const3', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Tirur","full_name":"Tirur Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const3', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Tirur"}'::jsonb WHERE email = 'c_tirur@orbit.com';
    END IF;

    -- Kottakkal (Active: 7)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_kottakkal@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_kottakkal@orbit.com', crypt('const7', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Kottakkal","full_name":"Kottakkal Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const7', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Kottakkal"}'::jsonb WHERE email = 'c_kottakkal@orbit.com';
    END IF;

    -- Thavanur (Active: 4)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_thavanur@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_thavanur@orbit.com', crypt('const4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Thavanur","full_name":"Thavanur Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const4', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Thavanur"}'::jsonb WHERE email = 'c_thavanur@orbit.com';
    END IF;

    -- Ponnani (Active: 3)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'c_ponnani@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'c_ponnani@orbit.com', crypt('const3', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"constituency","assigned_constituency":"Ponnani","full_name":"Ponnani Constituency Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('const3', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"constituency","assigned_constituency":"Ponnani"}'::jsonb WHERE email = 'c_ponnani@orbit.com';
    END IF;


    -- --------------------------------------------------------------------------
    -- 17 ACTIVE DISTRICT AUTH ACCOUNTS (Format: d_{name}@orbit.com / district{count})
    -- --------------------------------------------------------------------------

    -- Alappuzha (Active: 1)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_alappuzha@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_alappuzha@orbit.com', crypt('district1', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Alappuzha","full_name":"Alappuzha District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district1', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Alappuzha"}'::jsonb WHERE email = 'd_alappuzha@orbit.com';
    END IF;

    -- Ernakulam (Active: 4)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_ernakulam@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_ernakulam@orbit.com', crypt('district4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Ernakulam","full_name":"Ernakulam District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district4', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Ernakulam"}'::jsonb WHERE email = 'd_ernakulam@orbit.com';
    END IF;

    -- Idukki (Active: 1)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_idukki@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_idukki@orbit.com', crypt('district1', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Idukki","full_name":"Idukki District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district1', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Idukki"}'::jsonb WHERE email = 'd_idukki@orbit.com';
    END IF;

    -- Kannur (Active: 12)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_kannur@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_kannur@orbit.com', crypt('district12', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Kannur","full_name":"Kannur District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district12', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Kannur"}'::jsonb WHERE email = 'd_kannur@orbit.com';
    END IF;

    -- Karnataka (Active: 1)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_karnataka@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_karnataka@orbit.com', crypt('district1', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Karnataka","full_name":"Karnataka District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district1', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Karnataka"}'::jsonb WHERE email = 'd_karnataka@orbit.com';
    END IF;

    -- Kasaragod (Active: 7)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_kasaragod@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_kasaragod@orbit.com', crypt('district7', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Kasaragod","full_name":"Kasaragod District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district7', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Kasaragod"}'::jsonb WHERE email = 'd_kasaragod@orbit.com';
    END IF;

    -- Kollam (Active: 3)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_kollam@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_kollam@orbit.com', crypt('district3', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Kollam","full_name":"Kollam District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district3', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Kollam"}'::jsonb WHERE email = 'd_kollam@orbit.com';
    END IF;

    -- Kottayam (Active: 2)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_kottayam@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_kottayam@orbit.com', crypt('district2', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Kottayam","full_name":"Kottayam District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district2', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Kottayam"}'::jsonb WHERE email = 'd_kottayam@orbit.com';
    END IF;

    -- Kozhikode (Active: 17)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_kozhikode@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_kozhikode@orbit.com', crypt('district17', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Kozhikode","full_name":"Kozhikode District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district17', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Kozhikode"}'::jsonb WHERE email = 'd_kozhikode@orbit.com';
    END IF;

    -- Malappuram (Active: 59)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_malappuram@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_malappuram@orbit.com', crypt('district59', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Malappuram","full_name":"Malappuram District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district59', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Malappuram"}'::jsonb WHERE email = 'd_malappuram@orbit.com';
    END IF;

    -- Nilgiris (Active: 1)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_nilgiris@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_nilgiris@orbit.com', crypt('district1', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Nilgiris","full_name":"Nilgiris District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district1', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Nilgiris"}'::jsonb WHERE email = 'd_nilgiris@orbit.com';
    END IF;

    -- Palakkad (Active: 11)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_palakkad@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_palakkad@orbit.com', crypt('district11', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Palakkad","full_name":"Palakkad District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district11', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Palakkad"}'::jsonb WHERE email = 'd_palakkad@orbit.com';
    END IF;

    -- Pathanamthitta (Active: 1)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_pathanamthitta@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_pathanamthitta@orbit.com', crypt('district1', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Pathanamthitta","full_name":"Pathanamthitta District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district1', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Pathanamthitta"}'::jsonb WHERE email = 'd_pathanamthitta@orbit.com';
    END IF;

    -- South Andaman (Active: 1)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_southandaman@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_southandaman@orbit.com', crypt('district1', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"South Andaman","full_name":"South Andaman District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district1', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"South Andaman"}'::jsonb WHERE email = 'd_southandaman@orbit.com';
    END IF;

    -- Thiruvananthapuram (Active: 3)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_thiruvananthapuram@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_thiruvananthapuram@orbit.com', crypt('district3', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Thiruvananthapuram","full_name":"Thiruvananthapuram District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district3', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Thiruvananthapuram"}'::jsonb WHERE email = 'd_thiruvananthapuram@orbit.com';
    END IF;

    -- Thrissur (Active: 4)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_thrissur@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_thrissur@orbit.com', crypt('district4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Thrissur","full_name":"Thrissur District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district4', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Thrissur"}'::jsonb WHERE email = 'd_thrissur@orbit.com';
    END IF;

    -- Wayanad (Active: 1)
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'd_wayanad@orbit.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES (uid, '00000000-0000-0000-0000-000000000000', 'd_wayanad@orbit.com', crypt('district1', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"leader","leader_type":"district","assigned_district":"Wayanad","full_name":"Wayanad District Leader"}'::jsonb, now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('district1', gen_salt('bf')), raw_user_meta_data = raw_user_meta_data || '{"role":"leader","leader_type":"district","assigned_district":"Wayanad"}'::jsonb WHERE email = 'd_wayanad@orbit.com';
    END IF;

END $$;
