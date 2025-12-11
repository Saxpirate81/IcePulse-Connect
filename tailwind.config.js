/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './screens/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066FF',
        primaryDark: '#0052CC',
        secondary: '#00D4FF',
        accent: '#FF6B35',
        background: '#0A0E27',
        surface: '#1A1F3A',
        surfaceLight: '#252B45',
        text: '#FFFFFF',
        textSecondary: '#B0B8D1',
        textMuted: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        border: '#2D3447',
      },
    },
  },
  plugins: [],
}

