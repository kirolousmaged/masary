import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0D1117',
        surface: '#161B22',
        elevated: '#1F2937',
        card: '#1A2030',
        border: '#21262D',
      },
      fontFamily: {
        sans: ['var(--font-roboto)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'flash-green': 'flashGreen 0.65s ease-out',
        'flash-red': 'flashRed 0.65s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-dot': 'pulseDot 1.8s ease-in-out infinite',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'transparent' },
          '30%': { backgroundColor: 'rgba(16,185,129,0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'transparent' },
          '30%': { backgroundColor: 'rgba(239,68,68,0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
