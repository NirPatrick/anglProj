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

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
          const formData = `data=${encodeURIComponent(data)}`;
          const response = await fetch(target, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'OrientationMg/1.0 (https://angl-proj.vercel.app)',
              'Accept': 'application/json',
            },
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeout);
          const text = await response.text();
          res.setHeader('Content-Type', 'application/json');

          try {
            const json = JSON.parse(text);
            res.end(JSON.stringify(json));
          } catch {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: `Upstream ${response.status}` }));
          }
        } catch (err: any) {
          clearTimeout(timeout);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.name === 'AbortError' ? 'Timeout' : (err.message || 'Proxy error') }));
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