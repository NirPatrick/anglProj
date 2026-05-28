import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const OVERPASS_SERVERS = [
  'overpass-api.de',
  'overpass.kumi.systems',
  'maps.mail.ru',
];

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    proxy: Object.fromEntries(
      OVERPASS_SERVERS.map((host) => [
        `/api/overpass/${host}`,
        {
          target: `https://${host}`,
          changeOrigin: true,
          rewrite: (path) => '/api/interpreter' + path.replace(`/api/overpass/${host}`, ''),
        },
      ])
    ),
  },
})