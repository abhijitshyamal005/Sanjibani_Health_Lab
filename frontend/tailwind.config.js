/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"General Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#14532d',
          950: '#0f2a1f',
        },
        coral: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#14532d',
        },
        forest: {
          from: '#14532d',
          to: '#0f766e',
        },
        ink: {
          DEFAULT: '#1f2937',
          soft: '#374151',
          muted: '#6b7280',
        },
        cream: '#fff7ed',
        canvas: '#f9fafb',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,24,39,.04), 0 4px 16px -4px rgba(17,24,39,.08)',
        lift: '0 12px 32px -12px rgba(17,24,39,.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
