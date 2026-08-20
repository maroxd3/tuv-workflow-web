import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Ueberschreibbar, um den Dev-Server gegen eine andere API-Instanz
      // zu fahren (z. B. Test-Stack): VITE_API_PROXY_TARGET=http://127.0.0.1:8788
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8787',
    },
  },
  test: {
    globals: true,
    // Zwei Test-Projekte statt einer Sammelkonfiguration:
    //
    // frontend — jsdom, Dateien laufen parallel (reine Unit-/Flow-Tests
    //            gegen einen gemockten API-Client, kein geteilter Zustand).
    // server   — node, Dateien laufen NACHEINANDER (fileParallelism: false).
    //            Die Integrationstests reseeden in beforeEach dieselbe
    //            MariaDB; parallel laufende Dateien wuerden sich gegenseitig
    //            die Testdaten unter den Fuessen wegloeschen.
    projects: [
      {
        extends: true,
        test: {
          name: 'frontend',
          include: ['src/**/*.test.{js,jsx,ts,tsx}'],
          environment: 'jsdom',
          globals: true,
          setupFiles: './src/tests/setup.js',
        },
      },
      {
        extends: true,
        test: {
          name: 'server',
          include: ['server/**/*.test.js'],
          environment: 'node',
          globals: true,
          fileParallelism: false,
        },
      },
    ],
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
