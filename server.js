import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "YOUR_GROQ_API_KEY";

app.post("/chat", async (req, res) => {
  const message = req.body.message;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are Aashu Bot AI assistant." },
        { role: "user", content: message }
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
