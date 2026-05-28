import https from "https";
import http from "http";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const { server: target, data } = JSON.parse(body);
        if (!target || !data) {
          res.status(400).json({ error: "Missing server or data" });
          return resolve();
        }

        const postData = `data=${encodeURIComponent(data)}`;
        const url = new URL(target);

        const proxyReq = (url.protocol === "https:" ? https : http).request(
          {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData),
            },
          },
          (proxyRes) => {
            let responseData = "";
            proxyRes.on("data", (chunk) => { responseData += chunk.toString(); });
            proxyRes.on("end", () => {
              res.setHeader("Content-Type", "application/json");
              res.status(200).end(responseData);
              resolve();
            });
          }
        );

        proxyReq.on("error", (err) => {
          res.status(502).json({ error: err.message });
          resolve();
        });

        proxyReq.write(postData);
        proxyReq.end();
      } catch (err) {
        res.status(500).json({ error: err.message });
        resolve();
      }
    });
  });
}
