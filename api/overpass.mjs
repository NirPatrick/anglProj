export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const server = url.searchParams.get("server");
  const data = url.searchParams.get("data");

  if (!server || !data) {
    return res.status(400).json({ error: "Missing server or data parameter" });
  }

  try {
    const overpassUrl = `${server}?data=${encodeURIComponent(data)}`;
    const response = await fetch(overpassUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Overpass API ${response.status}` });
    }

    const json = await response.json();
    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
