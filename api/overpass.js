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

    const formData = `data=${encodeURIComponent(data)}`;
    const response = await fetch(server, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const result = await response.json();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
