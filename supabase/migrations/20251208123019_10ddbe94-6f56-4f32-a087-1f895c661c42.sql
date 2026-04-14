-- Create default admin user
-- Note: This creates the user in auth.users with a default password
-- Password: Admin@123456 (should be changed after first login)

-- First, we'll create the user via a function that bypasses normal signup
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Generate a fixed UUID for the admin
  admin_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Insert into auth.users if not exists
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token
  )
  VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@stellarorg.com',
    crypt('Admin@123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"username": "admin", "display_name": "Administrador"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert profile if not exists
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (admin_user_id, 'admin', 'Administrador')
  ON CONFLICT (id) DO NOTHING;

  -- Set admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;