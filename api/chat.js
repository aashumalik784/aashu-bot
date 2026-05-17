export default async function handler(req, res) {
  // Safe CORS aur Content-Type Headers define karein
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages, userProfile } = req.body;

    // Strict validation agar variables structured na aayein
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: "Invalid messages format template." });
    }

    // Live Date Calculation (IST)
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    const personality = `
You are Aashu AI, an authentic, adaptive AI collaborator with a touch of wit.
Current Live Context in India:
- Date: ${currentDate}
- Time: ${currentTime}
- Year: ${new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", year: "numeric" })}

Rules: Use markdown beautifully. Bullet points use karein lists ke liye. Friendly Hinglish/Hindi ya English mein hi baat karein.
`;

    // Static fetch call config without crashing environment
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: personality },
          ...(userProfile ? [{ role: "system", content: "User Profile: " + JSON.stringify(userProfile) }] : []),
          ...messages
        ],
        temperature: 0.7
      })
    });

    // Check if network structure failed
    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return res.status(groqResponse.status).json({ 
        reply: `Groq Gateway Error (Status ${groqResponse.status}): ${errorText}` 
      });
    }

    const data = await groqResponse.json();

    if (data?.error) {
      return res.status(400).json({ reply: `Groq Logic Error: ${data.error.message}` });
    }

    if (data?.choices?.[0]?.message?.content) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    }

    return res.status(200).json({ reply: "Aashu AI backend content was empty." });

  } catch (err) {
    console.error("Critical Catch Error:", err);
    return res.status(500).json({ reply: `AI Server Edge Crash: ${err.message}` });
  }
}
