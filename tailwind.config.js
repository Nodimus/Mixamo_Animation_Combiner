/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090a0f',
          900: '#0f1118',
          850: '#141722',
          800: '#1a1e2c',
          750: '#212739',
          700: '#2a324b',
          600: '#384364',
          500: '#4e5d8a'
        },
        brand: {
          500: '#0284c7',
          400: '#38bdf8',
          300: '#7dd3fc',
          600: '#0369a1'
        }
      }
    },
  },
  plugins: [],
}
