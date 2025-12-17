export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages
      })
    });

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content || "I’m here, but I couldn’t think of a reply.";

    res.status(200).json({ reply });
  } catch (err) {
    res.status(200).json({ reply: "I’m having trouble connecting right now." });
  }
}
