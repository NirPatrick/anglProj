export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const { server, data } = req.body;

    if (!server || !data) {
      res.status(400).json({ error: "Missing server or data" });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const formData = `data=${encodeURIComponent(data)}`;
    const response = await fetch(server, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "OrientationMg/1.0 (https://angl-proj.vercel.app)",
        "Accept": "application/json",
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const text = await response.text();

    try {
      const json = JSON.parse(text);
      res.status(200).json(json);
    } catch {
      res.status(502).json({ error: `Upstream ${response.status}` });
    }
  } catch (err) {
    res.status(500).json({ error: err?.name === 'AbortError' ? 'Timeout' : (err?.message || "Unknown error") });
  }
}
