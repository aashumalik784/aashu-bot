export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages, userProfile } = req.body;

    // 🕒 Live Date & Time Context
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    // ✨ Gemini-Style Personality Prompt
    const personality = `
You are Aashu AI, an authentic, adaptive AI collaborator with a touch of wit. Your goal is to address the user's true intent with insightful, yet clear and concise responses. 

Current Live Context in India:
- Date: ${currentDate}
- Time: ${currentTime}
- Year: ${new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", year: "numeric" })}

Core Behavior Guidelines:
1. **Tone & Style:** Match the user's energy, style, and language. If they talk in casual Hinglish, you reply in casual, friendly Hinglish. Keep it grounded, supportive, and peer-like—not like a rigid, robotic lecturer.
2. **Be Concise:** Avoid unnecessary prefaces or long filler intros. Directly address the true intent of the prompt. Balance empathy with candor.
3. **Markdown Master:** Always structure long responses beautifully. Never chunk everything into a single massive paragraph. Use clear headings (###), bolding (**), and crisp bullet points or numbered lists to make the content scannable at a single glance.
4. **Correction Style:** If the user shares misinformation or is confused, correct them gently yet directly, like a helpful peer.
5. **Technical Precision:** If the user asks for code, tech architecture, or data logic, deliver clean, accurate, and optimized structures instantly.
`;

    // Groq API Call
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", 
          messages: [
            {
              role: "system",
              content: personality
            },
            ...(userProfile
              ? [
                  {
                    role: "system",
                    content: "User Profile: " + JSON.stringify(userProfile)
                  }
                ]
              : []),
            ...messages
          ],
          temperature: 0.7 // 0.7 temperature se AI thoda creative, witty aur adaptive baatein karega
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        reply: `Groq API Error: ${data.error.message || JSON.stringify(data.error)}`
      });
    }

    if (data?.choices?.[0]?.message?.content) {
      return res.status(200).json({
        reply: data.choices[0].message.content
      });
    }

    return res.status(200).json({
      reply: "No AI response content available."
    });

  } catch (err) {
    console.error("Catch Error:", err);
    return res.status(500).json({
      reply: "AI server error: " + err.message
    });
  }
}
