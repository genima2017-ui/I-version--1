/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FFFFFF',
          100: '#FAFAF8',
          200: '#F3F3F0',
        },
        fog: {
          100: '#F1F2F3',
          200: '#E6E8EA',
          300: '#D5D8DC',
          400: '#B4B9C0',
          500: '#8C929B',
        },
        charcoal: {
          500: '#5C6169',
          600: '#4A4E56',
          700: '#383B42',
          800: '#2A2C31',
          900: '#1A1B1E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-in': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'sheet-in': 'sheet-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        pop: 'pop 300ms ease-out',
      },
    },
  },
  plugins: [],
};
