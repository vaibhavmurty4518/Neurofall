/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#080c14',
          subtle: '#0e1524',
          surface: '#131c2e',
          card: 'rgba(19, 28, 46, 0.75)',
        },
        brand: {
          cyan: '#00f0ff',
          sky: '#38bdf8',
          blue: '#3b82f6',
          purple: '#a855f7',
        },
        status: {
          ok: '#10b981',
          warn: '#f59e0b',
          danger: '#f43f5e',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(0, 240, 255, 0.3)',
        'glow-danger': '0 0 25px -5px rgba(244, 63, 94, 0.4)',
        'glow-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
