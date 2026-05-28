import axios from "axios";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const { server, data } = body;

    if (!server || !data) {
      return res.status(400).json({ error: "Missing server or data" });
    }

    const response = await axios.post(server, `data=${encodeURIComponent(data)}`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 60000,
    });

    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
