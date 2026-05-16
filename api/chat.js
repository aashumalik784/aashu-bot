import fetch from "node-fetch";

export default async function handler(req, res) {

  try {

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
                    content:
                      "User Profile: " +
                      JSON.stringify(userProfile)
                  }
                ]
              : []),

            ...messages
          ]
        })
      }
    );

    const data = await response.json();

    console.log(data);

    return res.status(200).json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "No AI response"
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      reply: "AI server error"
    });

  }
}
