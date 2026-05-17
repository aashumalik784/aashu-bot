export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages, userProfile } = req.body;

    // 🕒 Har baar fresh current date aur time calculate hoga (Lifetime system date fix)
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    // Hamesha sahi current year aur date maintain rakhne ke liye base context
    const personality = `
You are Aashu AI, a highly advanced, smart, and friendly AI assistant.
Your knowledge cutoff does not limit you because you are root-connected to the system clock.
Today's Official Live Date: ${currentDate}
Current Live Time: ${currentTime}
Current Year: ${new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", year: "numeric" })}

Guidelines:
1. Always respond using the real-time date provided above. Never say your knowledge is limited to 2023.
2. If the user asks about today's date, day, month, or year, look at the system clock context above and give the exact correct answer.
3. Be confident, helpful, and speak naturally in Hinglish/Hindi or English as preferred by the user.
`;

    // Groq API call
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
          temperature: 0.4 // Low temperature taaki model jhooth na bole aur facts par rahe
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
