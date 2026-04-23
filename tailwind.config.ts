import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── GWC Design Tokens ───────────────────────────────────────────────
        // Swap entire theme by changing CSS variables in globals.css
        // Opacity modifiers work: bg-gwc-accent/20, text-gwc-muted/60, etc.
        'gwc-base':        'rgb(var(--gwc-base) / <alpha-value>)',
        'gwc-panel':       'rgb(var(--gwc-panel) / <alpha-value>)',
        'gwc-raised':      'rgb(var(--gwc-raised) / <alpha-value>)',
        'gwc-text':        'rgb(var(--gwc-text) / <alpha-value>)',
        'gwc-muted':       'rgb(var(--gwc-muted) / <alpha-value>)',
        'gwc-dim':         'rgb(var(--gwc-dim) / <alpha-value>)',
        'gwc-accent':      'rgb(var(--gwc-accent) / <alpha-value>)',
        'gwc-accent-soft': 'rgb(var(--gwc-accent-soft) / <alpha-value>)',
        'gwc-accent-deep': 'rgb(var(--gwc-accent-deep) / <alpha-value>)',
        'gwc-success':     'rgb(var(--gwc-success) / <alpha-value>)',
        'gwc-error':       'rgb(var(--gwc-error) / <alpha-value>)',

        // ─── Legacy tokens (kept for compatibility) ──────────────────────────
        bg: {
          primary:   '#0f0e17',
          secondary: '#1a1830',
          card:      '#252340',
        },
        accent: {
          purple: '#7c6df2',
          violet: '#9b8cf5',
          pink:   '#c084fc',
        },
        text: {
          primary: '#e8e6f0',
          muted:   '#9b98b0',
        },
        success: '#4ade80',
        error:   '#f87171',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        tight:   ['var(--font-inter-tight)', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-inter-tight)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
