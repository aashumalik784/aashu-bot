export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;

    const lastMessage = messages[messages.length - 1]?.content || "";

    // 🖼️ IMAGE MODE DETECT
    if (
      lastMessage.toLowerCase().includes("image") ||
      lastMessage.toLowerCase().includes("generate")
    ) {
      return res.status(200).json({
        type: "image",
        reply:
          "https://image.pollinations.ai/prompt/" +
          encodeURIComponent(lastMessage)
      });
    }

    // 🤖 NORMAL CHAT (GROQ)
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
              content:
                "You are Aashu AI. You can chat, help, and answer questions."
            },
            ...messages
          ]
        })
      }
    );

    const data = await response.json();

    return res.status(200).json({
      type: "text",
      reply: data?.choices?.[0]?.message?.content || "No response"
    });
  } catch (err) {
    return res.status(500).json({ reply: "Server error" });
  }
}
