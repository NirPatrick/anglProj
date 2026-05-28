import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function overpassProxy() {
  return {
    name: 'overpass-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/overpass', async (req: any, res: any) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const { server: target, data } = body;

        try {
          const formData = `data=${encodeURIComponent(data)}`;
          const response = await fetch(target, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
          });
          const json = await response.json();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(json));
        } catch (err: any) {
          console.error('Overpass proxy error:', err.message);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    overpassProxy(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
})