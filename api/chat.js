export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const messages = [
  { role: "user", content: req.body.message }
];


    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages
      })
    });

    const data = await response.json();

if (!data.choices) {
  return res.status(200).json({
    reply: `OpenAI error: ${JSON.stringify(data)}`
  });
}

const reply = data.choices[0].message.content;
res.status(200).json({ reply });
