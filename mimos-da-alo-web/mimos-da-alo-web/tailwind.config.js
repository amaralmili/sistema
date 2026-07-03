/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF5EE',
        surface: '#FFFFFF',
        ink: '#2B211D',
        muted: '#8A7A70',
        sand: '#E7DCCF',
        wine: {
          DEFAULT: '#6F2C46',
          dark: '#4C1E32',
          light: '#8C3E5C',
        },
        gold: {
          DEFAULT: '#C79A54',
          light: '#E4C48A',
        },
        blush: '#F3DEE3',
        sage: {
          DEFAULT: '#55735C',
          light: '#E4EBE3',
        },
        rust: {
          DEFAULT: '#B0442F',
          light: '#F5DFD8',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(43, 33, 29, 0.04), 0 8px 24px -12px rgba(43, 33, 29, 0.12)',
        card: '0 1px 1px rgba(43, 33, 29, 0.03), 0 12px 32px -16px rgba(111, 44, 70, 0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
