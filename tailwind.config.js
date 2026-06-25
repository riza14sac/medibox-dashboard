/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medibox: {
          50: '#f0f4ff',
          100: '#e1e9fe',
          200: '#c7d6fe',
          300: '#a3bafd',
          400: '#7a94fc',
          500: '#546df7',
          600: '#3c4bec',
          700: '#313ad5',
          800: '#2b31ad',
          900: '#272d8a',
          950: '#1b1c53',
        }
      }
    },
  },
  plugins: [],
}
