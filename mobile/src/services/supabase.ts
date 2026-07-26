import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycjxirhzaundlnlzahdu.supabase.co';
const supabaseAnonKey = 'sb_publishable_9LjIgEm7c8A5nXHUsKA4SA_w1PjD_mK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);