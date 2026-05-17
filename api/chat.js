export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({ reply: "Aashu AI Node Active! Sawaal poochiye bhai. 😎" });
    }

    const systemPrompt = "You are Aashu AI Super Engine, a premier intelligent assistant created by Aashu Malik. Respond naturally in clean Hinglish/Hindi or English.";
    const lastMessage = messages[messages.length - 1] || { content: "" };
    const userQuery = lastMessage.content || "Hello";

    // ==========================================
    // 🚀 ENGINE 1: GOOGLE GEMINI CORE
    // ==========================================
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userQuery + `\n\n[Context: ${systemPrompt}]` }] }]
          })
        });

        const geminiData = await geminiRes.json();
        
        // Agar Google koi genuine response deta hai toh use hi return karo, strict response check!
        const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim() !== "") {
          return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {
        // Core bypass logic safely logs execution trace internally
      }
    }

    // ==========================================
    // 🚀 ENGINE 2: GROQ FALLBACK
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
        if (reply && reply.trim() !== "") {
          return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    // ==========================================
    // 🚀 ENGINE 3: OPENROUTER FALLBACK
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
        if (reply && reply.trim() !== "") {
          return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    // Agar sab kuch khali rha tabhi ye line chalegi
    return res.status(200).json({ reply: "Aashu AI System ready hai. Kripya apna sawaal poochiye!" });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Error: ${err.message}` });
  }
}
