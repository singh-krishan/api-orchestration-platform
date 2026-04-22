/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(6,182,212,0.35), 0 0 24px -4px rgba(6,182,212,0.45)',
        'glow-emerald': '0 0 0 1px rgba(16,185,129,0.35), 0 0 24px -4px rgba(16,185,129,0.45)',
        'glow-red': '0 0 0 1px rgba(239,68,68,0.4), 0 0 24px -4px rgba(239,68,68,0.5)'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        dashflow: {
          to: { strokeDashoffset: '-20' }
        }
      },
      animation: {
        shimmer: 'shimmer 2.2s linear infinite',
        dashflow: 'dashflow 1.2s linear infinite'
      }
    }
  },
  plugins: []
};
