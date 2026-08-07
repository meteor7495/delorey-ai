/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        surface: 'var(--surface)',
        line: 'var(--line)',
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
