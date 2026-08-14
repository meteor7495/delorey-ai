/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zh: {
          primary: 'var(--zh-primary)',
          'primary-50': 'var(--zh-primary-50)',
          pink: 'var(--zh-pink)',
          warning: 'var(--zh-warning)',
          info: '#0038BC',
          ink: 'var(--zh-ink)',
          900: 'var(--zh-900)',
          800: 'var(--zh-800)',
          700: 'var(--zh-700)',
          600: 'var(--zh-600)',
          500: 'var(--zh-500)',
          400: 'var(--zh-400)',
          300: 'var(--zh-300)',
          200: 'var(--zh-200)',
          100: 'var(--zh-100)',
          50: 'var(--zh-50)',
          bg: 'var(--zh-bg)',
          surface: 'var(--zh-surface)',
        },
        // keep aliases used across pages during migration
        dk: {
          red: 'var(--zh-primary)',
          deep: 'var(--zh-primary-hover)',
          navy: 'var(--zh-900)',
          text: 'var(--zh-800)',
          muted: 'var(--zh-600)',
          hint: 'var(--zh-400)',
          line: 'var(--zh-100)',
          bg: 'var(--zh-50)',
          search: 'var(--zh-50)',
          rating: 'var(--zh-warning)',
          green: '#00a049',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      boxShadow: {
        dk: '0 1px 0 rgba(0,0,0,.04)',
        'dk-card': '0 2px 12px rgba(41,44,45,.06)',
      },
      borderRadius: {
        dk: '8px',
        'dk-lg': '12px',
        'dk-xl': '16px',
      },
      maxWidth: {
        dk: '1440px',
      },
    },
  },
  plugins: [],
};
