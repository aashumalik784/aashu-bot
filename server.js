import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = "YOUR_GROQ_API_KEY";

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: userMessage }
      ]
    })
  });

  const data = await response.json();

  res.json({
    reply: data.choices[0].message.content
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
