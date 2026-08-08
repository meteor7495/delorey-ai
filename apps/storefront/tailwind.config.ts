/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zh: {
          primary: '#9B59B6',
          'primary-50': '#F5EEF8',
          pink: '#DE6A95',
          warning: '#EC8514',
          info: '#0038BC',
          ink: '#151617',
          900: '#292C2D',
          800: '#3E4344',
          700: '#52595A',
          600: '#676F71',
          500: '#858C8D',
          400: '#A4A9AA',
          300: '#C2C5C6',
          200: '#D1D4D4',
          100: '#E1E2E3',
          50: '#F0F1F1',
        },
        // keep aliases used across pages during migration
        dk: {
          red: '#9B59B6',
          deep: '#7D3C98',
          navy: '#292C2D',
          text: '#3E4344',
          muted: '#676F71',
          hint: '#A4A9AA',
          line: '#E1E2E3',
          bg: '#F0F1F1',
          search: '#F0F1F1',
          rating: '#EC8514',
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
