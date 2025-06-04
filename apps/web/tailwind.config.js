/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  future: {
    // Enable Tailwind v3 color opacity syntax
    respectDefaultRingColorOpacity: true,
  },
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
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        red: {
          500: '#EF4444',
          600: '#DC2626',
        },
        blue: {
          500: '#3B82F6',
          600: '#2563EB',
        },
      },
    },
  },
  plugins: [],
}
