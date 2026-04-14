/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        grailiq: {
          // Deep navy backgrounds
          ink: '#0B0B18',
          dark: '#1A1A2E',
          'dark-lighter': '#242444',
          // Primary purple family
          purple: '#7F77DD',
          'purple-light': '#9B94E8',
          'purple-dark': '#6B63C4',
          // Premium gold accent (for "grail" moments)
          gold: '#F4C430',
          'gold-light': '#FFDB6E',
          'gold-dark': '#C99A14',
          // Signal colors
          buy: '#22C55E',
          hold: '#F59E0B',
          watch: '#64748B',
          avoid: '#EF4444',
          // Light surfaces
          light: '#EEEDFE',
          surface: '#F8F8FF',
          // Aliases kept for backward compat
          green: '#22C55E',
          red: '#EF4444',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'marquee': 'marquee 80s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'ticker': 'ticker 60s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'rotate-text': 'rotateText 8s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        rotateText: {
          '0%, 20%': { transform: 'translateY(0)', opacity: '1' },
          '25%, 45%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%, 70%': { transform: 'translateY(-200%)', opacity: '1' },
          '75%, 95%': { transform: 'translateY(-300%)', opacity: '0' },
          '100%': { transform: 'translateY(-400%)', opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern':
          "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.04'%3E%3Cpath d='M0 0h80v80H0z'/%3E%3Cpath d='M0 40h80M40 0v80'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
