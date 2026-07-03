import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // ブランドカラー（赤基調）※クラス名は旧テーマとの互換のため peach のまま
        peach: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#E53E3E',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        // ベースカラー（白基調のニュートラル）
        warm: {
          50: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F0F0F0',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#565656',
          800: '#3A3A3A',
          900: '#212121',
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 15px rgba(0,0,0,0.06)',
        card: '0 4px 24px rgba(0,0,0,0.08)',
        peach: '0 4px 20px rgba(220,38,38,0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config
