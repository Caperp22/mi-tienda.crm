import { createClient } from '@supabase/supabase-js';

// Aquí leemos las claves secretas de tu archivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente principal — mantiene la sesión del usuario activo
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente auxiliar sin persistencia de sesión.
// Úsalo para crear cuentas de terceros (signUp de empresas)
// sin afectar la sesión del superadmin.
export const supabaseNoSession = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});