/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00E5FF",
        background: "#000000",
        surface: "#0A0A0A",
      },
    },
  },
  plugins: [],
}