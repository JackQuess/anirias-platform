/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        anirias: {
          red: '#E50914',
          black: '#141414',
          dark: '#1F1F1F',
        }
      }
    },
  },
  plugins: [],
}
