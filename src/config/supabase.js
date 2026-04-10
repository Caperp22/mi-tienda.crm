import { createClient } from '@supabase/supabase-js';

// Aquí leemos las claves secretas de tu archivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creamos la conexión oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey);