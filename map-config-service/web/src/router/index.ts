import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
  },
  {
    path: '/config/new',
    name: 'NewConfig',
    component: () => import('../views/ConfigEditor.vue'),
  },
  {
    path: '/config/:id/edit',
    name: 'EditConfig',
    component: () => import('../views/ConfigEditor.vue'),
  },
  {
    path: '/config/:id/preview',
    name: 'PreviewConfig',
    component: () => import('../views/MapPreview.vue'),
  },
  {
    path: '/config/:id/maputnik',
    name: 'MaputnikEditor',
    component: () => import('../views/MaputnikEditor.vue'),
  },
  {
    path: '/config/:id/maputnik-live',
    name: 'MaputnikLiveEditor',
    component: () => import('../views/MaputnikLiveEditor.vue'),
  },
  {
    path: '/discover',
    name: 'MapDiscovery',
    component: () => import('../views/MapDiscovery.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
  },
  {
    path: '/wms-test',
    name: 'WMSTestPage',
    component: () => import('../views/WMSTestPage.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('../views/HelpPage.vue'),
  },
  {
    path: '/preview-test',
    name: 'PreviewTest',
    component: () => import('../views/PreviewTestPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const publicPages = ['/login', '/preview-test'];
  const authRequired = !publicPages.includes(to.path);
  
  if (authRequired) {
    try {
      const { useAuthStore } = await import('../stores/auth');
      const authStore = useAuthStore();
      
      // Check if user is authenticated with Supabase
      const isValid = await authStore.checkAuth();
      if (!isValid) {
        return next('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Error checking auth, redirect to login
      return next('/login');
    }
  }
  
  next();
});

export default router;