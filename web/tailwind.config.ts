import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Urbanist Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--surface))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        'accent-lime': {
          DEFAULT: 'hsl(var(--accent-lime))',
          foreground: 'hsl(var(--accent-lime-foreground))',
        },
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          foreground: 'hsl(var(--ink-foreground))',
          surface: 'hsl(var(--ink-surface))',
          line: 'hsl(var(--ink-line))',
          muted: 'hsl(var(--ink-muted))',
        },
        'delta-down': {
          DEFAULT: 'hsl(var(--delta-down))',
          foreground: 'hsl(var(--delta-down-foreground))',
        },
        grove: {
          forest: 'hsl(var(--grove-forest))',
          clay: 'hsl(var(--grove-clay))',
          linen: 'hsl(var(--grove-linen))',
          terracotta: 'hsl(var(--grove-terracotta))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // Transitional aliases for R1–R2 (removed in R3)
        landing: {
          canvas: 'hsl(var(--background))',
          surface: 'hsl(var(--background))',
          card: 'hsl(var(--card))',
          'card-soft': 'hsl(var(--card))',
          line: 'hsl(var(--border))',
          muted: 'hsl(var(--muted-foreground))',
          ink: {
            DEFAULT: 'hsl(var(--ink))',
            foreground: 'hsl(var(--ink-foreground))',
            surface: 'hsl(var(--ink-surface))',
            line: 'hsl(var(--ink-line))',
            muted: 'hsl(var(--ink-muted))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent-lime))',
            foreground: 'hsl(var(--accent-lime-foreground))',
          },
          delta: {
            up: 'hsl(var(--accent-lime))',
            down: {
              DEFAULT: 'hsl(var(--delta-down))',
              foreground: 'hsl(var(--delta-down-foreground))',
            },
          },
        },
      },
      boxShadow: {
        landing: '0 24px 80px -24px hsl(var(--ink) / 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
