import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: '0.8125rem', // 13px base from @front
        sm: '0.875rem',
        base: '0.9375rem', // 15px
        lg: '1rem',
        xl: '1.125rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      screens: {
        'mobile': '768px', // @front mobile viewport
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noisy': 'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.02"/%3E%3C/svg%3E")',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // 統一カラーパレット
        // メイン: #83A4FF, サブ: #B9D4FF, アクセント: #FFD07F, エラー/削除: #FF9590, 背景: white
        gray: {
          0: '#ffffff',
          10: '#fcfcfc',
          15: '#f5f5f5',
          20: '#ebebeb',
          25: '#d6d6d6',
          30: '#cccccc',
          35: '#b3b3b3',
          40: '#999999',
          45: '#666666',
          50: '#4c4c4c',
          55: '#333333',
          60: '#292929',
          65: '#222222',
          70: '#1d1d1d',
          75: '#1b1b1b',
          80: '#171717',
          85: '#141414',
          90: '#0f0f0f',
          100: '#000000',
        },
        // メインカラー（青系）
        blue: {
          DEFAULT: '#83A4FF',
          50: '#F0F4FF',
          100: '#E0EAFF',
          200: '#B9D4FF',
          300: '#A3C2FF',
          400: '#83A4FF',
          500: '#6B8FE8',
          600: '#5578D1',
          700: '#4163BA',
          800: '#2F4F9E',
          900: '#1F3A7D',
        },
        // サブカラー（薄い青）
        secondary: {
          DEFAULT: 'hsl(var(--secondary, 219 100% 90%))',
          foreground: 'hsl(var(--secondary-foreground, 0 0% 20%))',
          light: '#E0EAFF',
          dark: '#83A4FF',
        },
        // アクセントカラー（オレンジ/黄色系）
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50: '#FFF8EB',
          100: '#FFF0D6',
          200: '#FFE4B8',
          300: '#FFD07F',
          400: '#FFBC4D',
          500: '#F5A623',
          600: '#D98F1A',
          700: '#B87514',
          800: '#965C0E',
          900: '#6B4209',
        },
        green: {
          DEFAULT: '#4CAF50',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        // エラー/削除カラー
        red: {
          DEFAULT: '#FF9590',
          50: '#FFF5F5',
          100: '#FFE8E7',
          200: '#FFD4D2',
          300: '#FFBAB8',
          400: '#FF9590',
          500: '#FF7A74',
          600: '#E85F59',
          700: '#D14540',
          800: '#B32D28',
          900: '#8C1A16',
        },
        yellow: {
          DEFAULT: '#FFD07F',
          50: '#FFF8EB',
          100: '#FFF0D6',
          200: '#FFE4B8',
          300: '#FFD07F',
          400: '#FFBC4D',
          500: '#F5A623',
          600: '#D98F1A',
          700: '#B87514',
          800: '#965C0E',
          900: '#6B4209',
        },
        // shadcn/ui colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'strong': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'extraLight': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
