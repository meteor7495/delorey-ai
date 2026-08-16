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
        ink: 'var(--color-text-primary)',
        mist: 'var(--color-text-tertiary)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          soft: 'var(--color-primary-soft)',
          text: 'var(--color-primary-text)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          soft: 'var(--color-secondary-soft)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          soft: 'var(--color-accent-soft)',
        },
        sand: 'var(--color-bg)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'none' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.75s cubic-bezier(0.22, 0.7, 0.28, 1) both',
        drift: 'drift 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
