/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#29A8FF',
          50: '#E6F6FF',
          100: '#CCE9FD',
          200: '#99D3FA',
          300: '#66BDF7',
          400: '#33A7F4',
          500: '#29A8FF',
          600: '#0076CC',
          700: '#005899',
          800: '#003B66',
          900: '#001D33',
        },
      },
    },
  },
  plugins: [],
}
