/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        raspberry: '#C3245D',
        teal: {
          50: '#E6FFFA',
          100: '#B2F5EA',
          200: '#81E6D9',
          300: '#4FD1C5',
          400: '#38B2AC',
          500: '#319795',
          600: '#2C7A7B',
          700: '#285E61',
          800: '#234E52',
          900: '#1D4044',
        },
        button: {
          primary: '#319795', // Teal-500
          hover: '#2C7A7B',   // Teal-600
          focus: '#285E61',   // Teal-700
          disabled: '#B2F5EA', // Teal-100
        },
        gray: {
          800: '#1F2937',
          900: '#111827',
        }
      },
    },
  },
  plugins: [],
}
