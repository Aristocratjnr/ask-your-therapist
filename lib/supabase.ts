import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Configuration Check:');
console.log('- URL available:', !!supabaseUrl);
console.log('- Key available:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Set session to expire after 2 days of inactivity (172800 seconds)
    storage: undefined, // Use default storage (AsyncStorage for React Native)
    storageKey: 'otconekt-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'otconekt-mobile',
    },
  },
});

// Export types for better TypeScript support
export type { User } from '@supabase/supabase-js';