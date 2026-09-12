/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Four-Persona Dynamic Panel Tokens
        panel: {
          'primary-900': 'var(--panel-primary-900)',
          'primary-800': 'var(--panel-primary-800)',
          'primary-600': 'var(--panel-primary-600)',
          'primary-50': 'var(--panel-primary-50)',
          accent: 'var(--panel-accent)',
        },
        // Theme: Fresh Emerald, Airy Cream Canvas & Warm Ochre
        primary: {
          DEFAULT: '#2A805E', // Fresh Emerald / Travel Leaf
          900: '#1E5C43',     // Polished Sage Dark
          800: '#2A805E',     // Core Brand Primary Action
          600: '#389E75',     // Fresh Jade Green
          400: '#62C098',     // Light Sage Accent
          100: '#E6F4ED',     // Pale Mint Fill
          50:  '#F4FAF6',     // Palest Mint Tag
        },
        brand: {
          DEFAULT: '#2A805E',
          hover: '#1E5C43',
          pressed: '#144230',
          dark: '#1E5C43',
          deep: '#144230',
          50: '#F4FAF6',
          100: '#E6F4ED',
          200: '#C2E8D7',
          500: '#2A805E',
          600: '#236E50',
          700: '#1E5C43',
          800: '#174B36',
          900: '#103828',
        },
        secondary: {
          DEFAULT: '#2E8B6E', // Balanced Clean Green
          900: '#22614E',
          800: '#2E8B6E',
          600: '#42A888',     // Natural Green (Success / Eco)
          400: '#72C7AC',     // Leaf Green
          50:  '#EBF7F2',     // Soft Light Green Tag
        },
        nature: {
          DEFAULT: '#2E8B6E',
          hover: '#22614E',
          light: '#EBF7F2',
          dark: '#1C523C',
        },
        accent: {
          DEFAULT: '#D96B43', // Warm Ochre & Terracotta
          900: '#A14624',
          800: '#C0542C',
          600: '#D96B43',     // Terracotta Accent
          400: '#F59E0B',     // Sunlight Amber
          50:  '#FDF6F0',
        },
        terracotta: {
          DEFAULT: '#D96B43',
          hover: '#C0542C',
          light: '#FDF6F0',
        },
        gold: {
          DEFAULT: '#F59E0B', // Sunlight Gold
          dark: '#D97706',
          light: '#FFFBEB',
        },
        trust: {
          DEFAULT: '#42A888',
          hover: '#2E8B6E',
          light: '#EBF7F2',
          dark: '#22614E',
        },
        action: {
          DEFAULT: '#2A805E',
          hover: '#1E5C43',
          light: '#F4FAF6',
          dark: '#144230',
        },
        semantic: {
          success: '#42A888',
          warning: '#D97706',
          error: '#C53030',
          info: '#0D9488',
          sos: '#C53030',
        },
        sos: {
          DEFAULT: '#C53030',
          hover: '#9B2C2C',
          light: '#FEF2F2',
        },
        neutral: {
          bg: '#FAFAF5',              // Airy Cream Canvas
          'bg-secondary': '#FFFFFF',  // Pure White Surface
          card: '#FFFFFF',            // Crisp White Card
          'text-primary': '#1E293B',  // Slate Charcoal Body Text
          'text-secondary': '#64748B',// Muted Slate Text
          muted: '#64748B',           // Muted Text
          disabled: '#CBD5E1',
          border: '#E2E8F0',          // Clean Light Border
          divider: '#F1F5F9',
        },

        ai: {
          bg: '#E8F2EC',
          border: '#D2E4DC',
          icon: '#174A3A',
          text: '#0B241C',
        },
        darkmode: {
          bg: '#121715',
          surface: '#1A211E',
          elevated: '#242D29',
          'text-primary': '#F5F7F6',
          'text-secondary': '#A4B0AA',
          brand: '#2E7860',
          green: '#3D8B68',
          orange: '#E2A33A',
          border: '#2F3C37',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'Manrope', 'sans-serif'],
      },
      borderRadius: {
        'ts-sm': '8px',
        'ts-md': '12px',
        'ts-lg': '16px',
        'ts-hero': '24px',
        'ts': '12px',
      },
      boxShadow: {
        'ts-card': '0 2px 8px -1px rgba(74, 27, 12, 0.05), 0 1px 3px 0 rgba(74, 27, 12, 0.03)',
        'ts-hover': '0 10px 25px -4px rgba(74, 27, 12, 0.10), 0 4px 6px -2px rgba(74, 27, 12, 0.05)',
        'ts-elevated': '0 20px 30px -6px rgba(113, 43, 19, 0.12), 0 8px 10px -4px rgba(113, 43, 19, 0.06)',
      },
    },
  },
  plugins: [],
}
