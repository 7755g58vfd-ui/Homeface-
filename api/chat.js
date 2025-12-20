Module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: req.body.message
      })
    });

    const data = await response.json();

    if (!data.output || !data.output[0]?.content) {
      return res.status(200).json({
        reply: `OpenAI error: ${JSON.stringify(data)}`
      });
    }

    const reply = data.output[0].content[0].text;
    res.status(200).json({ reply });

  } catch (err) {
    res.status(500).json({ reply: "Server error contacting AI" });
  }
}

