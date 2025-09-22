/*** Tailwind + DaisyUI config (ESM) ***/
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      container: { center: true, padding: '1rem' }
    }
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      'dark',
      {
        oildropdark: {
          'primary': '#2563eb',
          'secondary': '#6366f1',
          'accent': '#38bdf8',
          'neutral': '#1e293b',
          'base-100': '#0f172a',
          'info': '#38bdf8',
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444'
        }
      }
    ]
  }
};
