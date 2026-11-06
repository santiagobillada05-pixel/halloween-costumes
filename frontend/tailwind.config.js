/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orange:  { DEFAULT: '#ff7518', light: '#ff9a4d', dark: '#cc5c10' },
        purple:  { DEFAULT: '#6b21a8', light: '#a855f7', dark: '#4a1572' },
        void:    '#0a0a0f',
        'dark':  '#0f0f1a',
        'card':  '#14141f',
        'card2': '#1a1a2e',
        neon:    { green: '#39ff14', pink: '#ff0099', blue: '#00d4ff' },
      },
      fontFamily: {
        gothic: ['"Cinzel Decorative"', 'serif'],
        body:   ['Rajdhani', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        orange:  '0 0 20px rgba(255,117,24,0.4), 0 0 60px rgba(255,117,24,0.1)',
        purple:  '0 0 20px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.1)',
        'orange-sm': '0 0 10px rgba(255,117,24,0.4)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float':      'float 4s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%,100%': { filter: 'drop-shadow(0 0 8px #ff7518)' },
          '50%':     { filter: 'drop-shadow(0 0 22px #ff7518) drop-shadow(0 0 40px rgba(255,117,24,.5))' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
