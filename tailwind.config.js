/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pruaned: {
          navy: '#0C2340',
          dark: '#002855',
          blue: '#0284C7',
          red: '#DC2626',
          green: '#16A34A',
          amber: '#D97706',
          brown: '#854D0E'
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif']
      }
    },
  },
  plugins: [],
}
