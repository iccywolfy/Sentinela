/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0d1117',
          800: '#1a1f36',
          700: '#252d4a',
          600: '#2f3a5e',
        },
        gold: {
          500: '#c9a227',
          400: '#d4af37',
          300: '#f0c040',
        },
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
    },
  },
  plugins: [],
};
