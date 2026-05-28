export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Extract host from the URL path: /api/overpass/{host}
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // ["api", "overpass", "host"]
  const host = pathParts[2];

  if (!host) {
    return res.status(400).json({ error: "Missing host in URL path" });
  }

  try {
    const serverUrl = `https://${host}/api/interpreter`;
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: req.body,
    });

    const json = await response.json();
    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
