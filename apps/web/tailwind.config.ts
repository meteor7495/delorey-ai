/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      colors: {
        ink: '#071018',
        mist: '#9DB4C0',
        teal: {
          DEFAULT: '#0F6E6E',
          bright: '#1FA8A0',
          soft: '#D7F0EE',
        },
        sand: '#E8F0F2',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'none' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.2, 0.7, 0.3, 1) both',
        drift: 'drift 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
