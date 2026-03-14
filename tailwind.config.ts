import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        libra: {
          50: '#f8f7f4',
          100: '#efede6',
          200: '#ddd8ca',
          300: '#c7bea7',
          400: '#b0a183',
          500: '#9f8d6b',
          600: '#927d5f',
          700: '#7a6750',
          800: '#645445',
          900: '#52463a',
          950: '#2b241e',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
