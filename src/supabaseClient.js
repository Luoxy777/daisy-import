// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ini fungsi untuk membuka koneksi ke Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);