/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#4ECDC4',
        'bg-main': '#FAFAF8',
        'text-main': '#1A1A1A',
        'text-sub': '#6B7280',
        'macro-protein': '#4ECDC4',
        'macro-carbs': '#FF6B35',
        'macro-fat': '#FFD166',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
