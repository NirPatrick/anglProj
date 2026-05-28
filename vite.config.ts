import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import https from 'https'
import http from 'http'

function overpassProxy() {
  return {
    name: 'overpass-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/overpass', (req: any, res: any) => {
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { server: target, data } = JSON.parse(body);
            const postData = `data=${encodeURIComponent(data)}`;
            const url = new URL(target);

            const proxyReq = (url.protocol === 'https:' ? https : http).request(
              {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Content-Length': Buffer.byteLength(postData),
                },
              },
              (proxyRes) => {
                let responseData = '';
                proxyRes.on('data', (chunk: Buffer) => { responseData += chunk.toString(); });
                proxyRes.on('end', () => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(responseData);
                });
              }
            );

            proxyReq.on('error', (err: any) => {
              console.error('Proxy error:', err.message);
              res.statusCode = 502;
              res.end(JSON.stringify({ error: err.message }));
            });

            proxyReq.write(postData);
            proxyReq.end();
          } catch (err: any) {
            console.error('Parse error:', err.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
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