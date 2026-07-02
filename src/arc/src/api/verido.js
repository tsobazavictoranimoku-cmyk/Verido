// Simple in-memory rate limiter — resets if the function cold-starts,
// but stops casual abuse and repeated clicking from one visitor.
const requestLog = new Map();
const LIMIT = 10;              // max requests
const WINDOW_MS = 60 * 60 * 1000; // per hour

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestLog.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count += 1;
  requestLog.set(ip, entry);

  return entry.count > LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in a bit." });
  }

  const { systemPrompt, userPrompt } = req.body;

  if (!systemPrompt || !userPrompt || userPrompt.length > 4000) {
    return res.status(400).json({ error: "Invalid request." });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await r.json();
    res.status(200).json({ text: data.content?.[0]?.text || "" });
  } catch (err) {
    res.status(500).json({ error: "Verido is temporarily unavailable." });
  }
}
