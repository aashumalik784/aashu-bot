export default async function handler(req, res) {
  try {
    // Sirf POST requests allow karne ke liye
    if (req.method !== "POST") {
      return res.status(405).json({
        reply: "Only POST allowed"
      });
    }

    const { messages, userProfile } = req.body;

    const personality = `
You are Aashu AI.
Friendly, smart and helpful AI assistant.
`;

    // Built-in Native Fetch (Groq API Endpoint)
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          // 🚀 Updated working model (Purana llama3-8b-8192 decommission ho chuka hai)
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
          ]
        })
      }
    );

    const data = await response.json();

    // 🔴 Agar Groq API koi error bhejti hai
    if (data.error) {
      return res.status(400).json({
        reply: `Groq API Error: ${data.error.message || JSON.stringify(data.error)}`
      });
    }

    // 🟢 Agar response sahi-salamat mil jata hai
    if (data?.choices?.[0]?.message?.content) {
      return res.status(200).json({
        reply: data.choices[0].message.content
      });
    }

    // Default fallback
    return res.status(200).json({
      reply: "No AI response content available. Check Vercel logs."
    });

  } catch (err) {
    console.error("Catch Error:", err);
    return res.status(500).json({
      reply: "AI server error: " + err.message
    });
  }
}
