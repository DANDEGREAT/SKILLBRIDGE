/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#C47A00', mid: '#E8960A', light: '#FFF3D4', dark: '#7A4C00' },
        accent: { DEFAULT: '#0A6B7C', mid: '#0E8EA6', light: '#D4F4FA', dark: '#044554' },
        power: { DEFAULT: '#B22222', light: '#FDEAEA' },
        success: { DEFAULT: '#1A6B3C', light: '#D4EDDA' },
        bg: { DEFAULT: '#0F0F0F', 2: '#1A1A1A', 3: '#242424', 4: '#2E2E2E' },
        text: { DEFAULT: '#F0EDE8', 2: '#B8B0A4', 3: '#6E6860', inv: '#0F0F0F' },
        border: { DEFAULT: 'rgba(255,255,255,0.08)', 2: 'rgba(255,255,255,0.14)' },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'drift': 'drift 3s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(100%)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 8px rgba(196,122,0,0.3)' }, '50%': { boxShadow: '0 0 24px rgba(196,122,0,0.5)' } },
        shake: { '0%, 100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-8px)' }, '75%': { transform: 'translateX(8px)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        drift: { '0%, 100%': { transform: 'translate(0, 0)' }, '33%': { transform: 'translate(2px, -1px)' }, '66%': { transform: 'translate(-1px, 2px)' } },
        countUp: { '0%': { opacity: '0', transform: 'scale(0.8)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
