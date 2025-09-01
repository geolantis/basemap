import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

import './style.css';
import 'primeicons/primeicons.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
// Custom PrimeVue theme configuration with Basemap branding
const customAuraTheme = {
  ...Aura,
  semantic: {
    ...Aura.semantic,
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#2563eb', // Brand primary
      600: '#1d4ed8',
      700: '#1e40af', // Brand primary dark
      800: '#1e3a8a',
      900: '#1e3a8a',
      950: '#172554'
    },
    colorScheme: {
      light: {
        primary: {
          color: '#2563eb',
          contrastColor: '#ffffff',
          hoverColor: '#1e40af',
          activeColor: '#1d4ed8'
        },
        highlight: {
          background: '#2563eb',
          focusBackground: '#1e40af',
          color: '#ffffff',
          focusColor: '#ffffff'
        }
      }
    }
  }
};

app.use(PrimeVue, {
  theme: {
    preset: customAuraTheme,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
});

app.mount('#app');