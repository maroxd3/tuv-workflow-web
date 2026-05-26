import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx,ts,tsx}', 'server/**/*.js'],
      exclude: [
        '**/*.test.*',
        '**/tests/**',
        'src-tauri/**',
        'src/main.jsx',
        'src/tests/setup.js',
      ],
      reporter: ['text', 'html'],
      // all: true zwingt v8 dazu, ALLE gematchten Dateien zu bewerten,
      // nicht nur die, die ein Test importiert hat. Ohne diese Flagge
      // erschien das Backend mit 0 % unsichtbar im Coverage-Report.
      all: true,
    },
  },
})
