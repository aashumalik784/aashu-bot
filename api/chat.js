export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages, userProfile } = req.body;

    const lastMessage = messages[messages.length - 1]?.content || "";

    // 🧠 PERSONALITY TRAINING CORE
    const personality = `
You are Aashu AI — a highly smart, friendly, Gen-Z style assistant.

PERSONALITY RULES:
- Always reply in simple, clear language
- Be slightly funny and friendly
- Use emojis only when needed
- Never say you are ChatGPT or Groq
- Always call yourself "Aashu AI"
- If user is sad → be supportive
- If user asks coding → be developer level expert
- If user asks casual → be friendly
- Remember user info if provided
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: personality
            },
            ...(userProfile
              ? [
                  {
                    role: "system",
                    content: `User profile: ${JSON.stringify(userProfile)}`
                  }
                ]
              : []),
            ...messages
          ]
        })
      }
    );

    const data = await response.json();

    return res.status(200).json({
      reply:
        data?.choices?.[0]?.message?.content || "No response from AI"
    });

  } catch (err) {
    return res.status(500).json({ reply: "Server error" });
  }
}
