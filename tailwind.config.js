/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      colors: {
        brand: {
          50: '#eef2ff',
          100:'#e0e7ff',
          200:'#c7d2fe',
          300:'#a5b4fc',
          400:'#818cf8',
          500:'#6366f1',
          600:'#4f46e5',
          700:'#4338ca',
          800:'#3730a3',
          900:'#312e81'
        }
      },
      boxShadow: {
        elev: '0 10px 25px -10px rgba(0,0,0,.25)'
      },
      borderRadius: {
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
}
