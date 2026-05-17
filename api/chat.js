export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages, userProfile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: "Messages format is missing or invalid." });
    }

    // 🕒 Live Date Setup (IST)
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    const personality = `
You are Aashu AI, an authentic, adaptive AI collaborator with a touch of wit.
Current Live Context in India:
- Date: ${currentDate}
- Time: ${currentTime}
- Year: ${new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", year: "numeric" })}

Rules: Respond casually, use beautiful markdown bullet points for lists, and speak naturally in Hinglish/Hindi or English. 
`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "⚠️ Backend Config Error: Vercel par 'GROQ_API_KEY' missing hai." });
    }

    // Initialize structured message chain for Groq Text-only Model
    const groqMessages = [
      { role: "system", content: personality },
      ...(userProfile ? [{ role: "system", content: `User Profile: ${JSON.stringify(userProfile)}` }] : [])
    ];

    messages.forEach((msg) => {
      if (msg.role === "user") {
        groqMessages.push({ role: "user", content: String(msg.content || "") });
      } else {
        groqMessages.push({ role: "assistant", content: String(msg.content || "") });
      }
    });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // 🔥 Hamesha chalne wala best core model set kar diya hai
        messages: groqMessages,
        temperature: 0.6
      })
    });

    const data = await response.json();

    if (data?.error) {
      return res.status(200).json({ reply: `Groq Alert: ${data.error.message}` });
    }

    if (data?.choices?.[0]?.message?.content) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    }

    return res.status(200).json({ reply: "Aashu AI backend received an empty payload response." });

  } catch (err) {
    console.error("Crash Caught:", err);
    return res.status(200).json({ reply: `⚠️ Edge Function Note: ${err.message}` });
  }
}
