/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand-color)',
        brand2: 'var(--brand-color-2)',
        dark: 'var(--dark-color)',
        darkbox: 'var(--dark-color-box)',
        darktext: 'var(--dark-text)',
      },
      backgroundColor: {
        brand: 'rgb(212,188,0)',
      },
    },
  },
  plugins: [],
};
