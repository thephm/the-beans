/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf7ff',
          100: '#f3edff',
          200: '#e9dfff',
          300: '#d7c5ff',
          400: '#be9cff',
          500: '#a673ff',
          600: '#9147ff',
          700: '#7d2cf7',
          800: '#6722d3',
          900: '#551dae',
          950: '#37106b',
        },
        lavender: {
          50: '#faf8ff',
          100: '#f3f0ff',
          200: '#e9e5ff',
          300: '#d9ceff',
          400: '#c4a9ff',
          500: '#ad7dff',
          600: '#9854ff',
          700: '#8539ed',
          800: '#7131c9',
          900: '#5e29a4',
          950: '#3f1970',
        },
        violet: {
          50: '#faf7ff',
          100: '#f3edff',
          200: '#e9dfff',
          300: '#d7c5ff',
          400: '#be9cff',
          500: '#a673ff',
          600: '#8b42ff',
          700: '#7c2d12',
          800: '#6d28d9',
          900: '#581c87',
          950: '#3c1361',
        },
        orchid: {
          50: '#fef7ff',
          100: '#fdf2ff',
          200: '#fce7ff',
          300: '#f9d0ff',
          400: '#f3a8ff',
          500: '#ec7cff',
          600: '#dd50ff',
          700: '#c935ed',
          800: '#a52cc2',
          900: '#88299d',
          950: '#5a1169',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-purple': 'linear-gradient(135deg, #f3edff 0%, #e9dfff 50%, #d7c5ff 100%)',
        'gradient-lavender': 'linear-gradient(135deg, #faf8ff 0%, #f3f0ff 50%, #e9e5ff 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
