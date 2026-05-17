export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;
    
    // Fallback block agar array khali ho
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({ reply: "Aashu Malik ke Super Engine node live hain. Aap apna sawaal pooch sakte hain! 😎" });
    }

    const systemPrompt = `
You are Aashu AI Super Engine, a premier intelligent assistant created by Aashu Malik.
Respond naturally in clean Hinglish/Hindi or English. Use markdown bullet points for lists.
If the user asks for a website link, wrap it in markdown format: [Click here to open](https://example.com).
CRITICAL: Do NOT append any server logs, engine names, or text footers at the end of your response.
`;

    // Extract the absolute last message safely to avoid nested array crashes
    const lastMessage = messages[messages.length - 1] || { content: "" };
    const userQuery = lastMessage.content || "Hello";
    const hasImage = !!lastMessage.image;
    
    let base64Raw = "";
    let mimeType = "image/jpeg";
    if (hasImage) {
      base64Raw = lastMessage.image.includes(",") ? lastMessage.image.split(",")[1] : lastMessage.image;
      if (lastMessage.image.includes("data:")) {
        mimeType = lastMessage.image.split(",")[0].split(":")[1].split(";")[0];
      }
    }

    // ==========================================
    // 🚀 ENGINE 1: GEMINI CORE (Direct Extraction)
    // ==========================================
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage) {
          parts.push({ inlineData: { data: base64Raw, mimeType: mimeType } });
        }
        parts.push({ text: userQuery + `\n\n[System Context: ${systemPrompt}]` });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: parts }] })
        });

        const geminiData = await geminiRes.json();
        const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) {}
    }

    // ==========================================
    // 🚀 ENGINE 2: OPENROUTER FALLBACK
    // ==========================================
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ]
          })
        });
        const orData = await openRouterRes.json();
        const reply = orData?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) {}
    }

    // ==========================================
    // 🚀 ENGINE 3: GROQ FALLBACK
    // ==========================================
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ]
          })
        });
        const groqData = await groqRes.json();
        const reply = groqData?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) {}
    }

    // Default return message if server variables are processing slowly
    return res.status(200).json({ reply: "Aashu AI Console ready. Main bilkul active hoon, aap apna sawaal pooch sakte hain!" });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Server Sync Failure: ${err.message}` });
  }
}
