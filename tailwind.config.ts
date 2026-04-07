import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0e17',
          secondary: '#1a1830',
          card: '#252340',
        },
        accent: {
          purple: '#7c6df2',
          violet: '#9b8cf5',
          pink: '#c084fc',
        },
        text: {
          primary: '#e8e6f0',
          muted: '#9b98b0',
        },
        success: '#4ade80',
        error: '#f87171',
      },
    },
  },
  plugins: [],
}

export default config
