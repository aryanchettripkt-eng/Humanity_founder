import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        landing: {
          canvas: 'hsl(var(--landing-canvas))',
          surface: 'hsl(var(--landing-surface))',
          card: 'hsl(var(--landing-card))',
          'card-soft': 'hsl(var(--landing-card-soft))',
          line: 'hsl(var(--landing-line))',
          muted: 'hsl(var(--landing-muted))',
          ink: {
            DEFAULT: 'hsl(var(--landing-ink))',
            foreground: 'hsl(var(--landing-ink-foreground))',
            surface: 'hsl(var(--landing-ink-surface))',
            line: 'hsl(var(--landing-ink-line))',
            muted: 'hsl(var(--landing-ink-muted))',
          },
          accent: {
            DEFAULT: 'hsl(var(--landing-accent))',
            foreground: 'hsl(var(--landing-accent-foreground))',
          },
          delta: {
            up: 'hsl(var(--landing-delta-up))',
            down: {
              DEFAULT: 'hsl(var(--landing-delta-down))',
              foreground: 'hsl(var(--landing-delta-down-foreground))',
            },
          },
        },
      },
      boxShadow: {
        landing: '0 24px 80px -24px hsl(var(--landing-ink) / 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;

