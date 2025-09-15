import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConfigStore = defineStore('config', () => {
  const apiUrl = ref(import.meta.env.VITE_API_URL || '');
  const supabaseUrl = ref(import.meta.env.VITE_SUPABASE_URL || '');
  const supabaseAnonKey = ref(import.meta.env.VITE_SUPABASE_ANON_KEY || '');

  const isProduction = ref(import.meta.env.PROD);
  const isDevelopment = ref(import.meta.env.DEV);

  return {
    apiUrl,
    supabaseUrl,
    supabaseAnonKey,
    isProduction,
    isDevelopment
  };
});