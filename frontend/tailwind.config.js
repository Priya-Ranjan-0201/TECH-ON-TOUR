/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme 1: Heritage Earth Colors
        primary: {
          50: '#FAECE7',
          100: '#F5C4B3',
          400: '#D85A30',
          600: '#993C1D',
          800: '#712B13', // Core Terracotta
          900: '#4A1B0C',
        },
        secondary: {
          50: '#EAF3DE',
          400: '#639922',
          600: '#3B6D11',
          800: '#27500A', // Forest Canopy
          900: '#173404',
        },
        accent: {
          50: '#FAEEDA',
          400: '#E5A93C', // Temple Gold
          600: '#854F0B',
          800: '#633806',
          900: '#412402',
        },
        saffron: {
          light: '#FF8F3D',
          DEFAULT: '#FF6F00',
          dark: '#B34E00',
        },
        teal: {
          light: '#00A3A3',
          DEFAULT: '#008080',
          dark: '#004D4D',
        },
        alert: {
          50: '#FFEBEE',
          600: '#D32F2F',
          800: '#B71C1C',
        },
        ivory: '#FDFBF7',
        charcoal: '#1C2833',
        neutral: {
          50: '#FDFBF7',
          100: '#F5F7FA',
          200: '#E0E0E0',
          400: '#888780',
          600: '#5F5E5A',
          900: '#2C2C2A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        'ts': '12px',
      },
      boxShadow: {
        'ts-card': '0 2px 8px -2px rgba(113, 43, 19, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'ts-glass': '0 8px 32px 0 rgba(113, 43, 19, 0.08)',
      },
    },
  },
  plugins: [],
}
