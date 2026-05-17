export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages, userProfile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: "Messages format is invalid." });
    }

    // 🕒 Live Date & Time Calculation (IST Format)
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    const personality = `
You are Aashu AI, the ultimate All-in-One Super AI assistant designed by Aashu Malik. 
You possess the reasoning of Claude, the coding intelligence of GPT-4, and the visual understanding of top-tier vision models.

Current Live Context in India:
- Date: ${currentDate}
- Time: ${currentTime}
- Year: ${new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", year: "numeric" })}

Your Capabilities:
1. **Advanced Coding & Architecture**: Provide instantly ready, production-grade code snippets for Web, App (Flutter/Kodular), and Automation scripts without bugs.
2. **Vision Engine**: Deeply analyze attached screenshots, trace frontend/backend bugs, read diagrams, and interpret handwritten notes.
3. **Witty & Peer-like Persona**: Speak casually in friendly Hinglish/Hindi or English. Never sound robotic or say your knowledge is limited to 2023. You are fully live.
`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "⚠️ Config Error: Vercel Environment Variables mein 'GROQ_API_KEY' missing hai." });
    }

    // Dynamic Payload Mapping for Vision/Text Analytics
    const groqMessages = [
      { role: "system", content: personality },
      ...(userProfile ? [{ role: "system", content: `User Profile: ${JSON.stringify(userProfile)}` }] : [])
    ];

    messages.forEach((msg) => {
      if (msg.role === "user") {
        if (msg.image) {
          groqMessages.push({
            role: "user",
            content: [
              { type: "text", text: msg.content || "Analyze this attached image file thoroughly." },
              { type: "image_url", image_url: { url: msg.image } }
            ]
          });
        } else {
          groqMessages.push({ role: "user", content: String(msg.content || "") });
        }
      } else {
        groqMessages.push({ role: "assistant", content: String(msg.content || "") });
      }
    });

    // Using Llama 3.2 Vision Preview for handling multi-modal super reasoning instantly
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: groqMessages,
        temperature: 0.6
      })
    });

    const data = await response.json();

    if (data?.error) {
      return res.status(200).json({ reply: `Groq Interface Note: ${data.error.message}` });
    }

    if (data?.choices?.[0]?.message?.content) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    }

    return res.status(200).json({ reply: "Aashu AI backend received an empty payload response state." });

  } catch (err) {
    console.error("Global Engine Error:", err);
    return res.status(200).json({ reply: `⚠️ Edge Function Note: ${err.message}` });
  }
}
