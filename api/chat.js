export default function handler(req, res) {
  res.status(200).json({
    reply: "Homeface is awake now ✅"
  });
}
