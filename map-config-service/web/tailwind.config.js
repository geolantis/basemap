/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Basemap brand colors
        brand: {
          primary: '#2563EB',
          'primary-dark': '#1E40AF',
          'primary-light': '#3B82F6',
          secondary: '#059669',
          accent: '#7C3AED',
        },
        // Legacy color support
        primary: '#2563EB',
        secondary: '#059669',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        // Extended neutral palette
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      maxWidth: {
        'brand': '1280px',
      },
      height: {
        'header': '64px',
        'footer': '80px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}