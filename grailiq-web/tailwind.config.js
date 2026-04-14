/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        grailiq: {
          dark: '#1A1A2E',
          'dark-lighter': '#242444',
          purple: '#7F77DD',
          'purple-light': '#9B94E8',
          'purple-dark': '#6B63C4',
          light: '#EEEDFE',
          surface: '#F8F8FF',
          green: '#22C55E',
          red: '#EF4444',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
