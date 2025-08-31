import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter();
  
  // State
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => true); // For now, all authenticated users are admins
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin');

  // Actions
  async function login(email: string, password: string) {
    isLoading.value = true;
    error.value = null;

    try {
      console.log('Attempting Supabase login...');
      // Use Supabase Auth for authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        throw new Error(authError.message);
      }

      if (data.user) {
        console.log('Login successful, user:', data.user);
        user.value = {
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.user_metadata?.role || 'admin'
        };

        // Force navigation to dashboard
        console.log('Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
        
        return { success: true };
      }

      throw new Error('Login failed');
    } catch (err: any) {
      console.error('Login error:', err);
      error.value = err.message || 'Login failed';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }

    user.value = null;
    await router.push('/login');
  }

  async function refreshSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        await logout();
        return false;
      }

      if (session.user) {
        user.value = {
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'admin'
        };
      }

      return true;
    } catch (err) {
      await logout();
      return false;
    }
  }

  async function checkAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return false;
      }

      if (session.user) {
        user.value = {
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'admin'
        };
        return true;
      }

      return false;
    } catch (err) {
      console.error('Auth check error:', err);
      return false;
    }
  }

  // Initialize auth state on store creation
  checkAuth();

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      user.value = {
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.user_metadata?.role || 'admin'
      };
    } else {
      user.value = null;
    }
  });

  return {
    // State
    user,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    
    // Actions
    login,
    logout,
    checkAuth,
    refreshSession
  };
});