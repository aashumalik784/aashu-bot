export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({ reply: "Hello Aashu! Main live hoon, aap apna sawaal pooch sakte hain. 😎" });
    }

    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    const systemPrompt = `
You are Aashu AI Super Engine, a premier intelligent assistant created by Aashu Malik. 
Current Context: Date: ${currentDate} | Time: ${currentTime} | Location: India.

CRITICAL FORMATTING RULES:
1. Whenever you provide a website link or URL, ALWAYS wrap it in markdown hyperlink format: [Click here to open](https://example.com) or [https://example.com](https://example.com). NEVER send raw text links inside double asterisks.
2. Respond naturally in clean Hinglish/Hindi or English. Use markdown bullet points for lists.
3. ABSOLUTELY CLEAN OUTPUT REQUIRED: Do NOT append any server metadata, logs, engine brand names, debug texts, or bracketed footers at the end of your text. Stop immediately after answering the user query.
`;

    // Safely pull the last message block
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
    // 🚀 ENGINE 1: GOOGLE GEMINI CORE (Direct String Setup)
    // ==========================================
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage) {
          parts.push({ inlineData: { data: base64Raw, mimeType: mimeType } });
        }
        parts.push({ text: userQuery + `\n\n[System Core Directive: ${systemPrompt}]` });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: parts }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 2048 }
          })
        });

        const geminiData = await geminiRes.json();
        let reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (reply) {
          reply = reply.replace(/\*?\(?\s*🔥?\s*Engine:\s*[^)]+\s*\)?\*?/gi, "").trim();
          return res.status(200).json({ reply });
        }
      } catch (e) {}
    }

    // ==========================================
    // 🚀 ENGINE 2: OPENROUTER (Ultra Intelligent Direct Standard Fallback)
    // ==========================================
    if (process.env.OPENROUTER_API_KEY) {
      try {
        let contentPayload = hasImage ? [
          { type: "text", text: userQuery },
          { type: "image_url", image_url: { url: lastMessage.image } }
        ] : userQuery;

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
              { role: "user", content: contentPayload }
            ]
          })
        });
        const orData = await openRouterRes.json();
        let reply = orData?.choices?.[0]?.message?.content;
        if (reply) {
          reply = reply.replace(/\*?\(?\s*🔥?\s*Engine:\s*[^)]+\s*\)?\*?/gi, "").trim();
          return res.status(200).json({ reply });
        }
      } catch (e) {}
    }

    // ==========================================
    // 🚀 ENGINE 3: GROQ VISION FALLBACK
    // ==========================================
    if (process.env.GROQ_API_KEY) {
      try {
        let contentPayload = hasImage ? [
          { type: "text", text: userQuery },
          { type: "image_url", image_url: { url: lastMessage.image } }
        ] : userQuery;

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
              { role: "user", content: contentPayload }
            ],
            temperature: 0.4
          })
        });
        const groqData = await groqRes.json();
        let reply = groqData?.choices?.[0]?.message?.content;
        if (reply) {
          reply = reply.replace(/\*?\(?\s*🔥?\s*Engine:\s*[^)]+\s*\)?\*?/gi, "").trim();
          return res.status(200).json({ reply });
        }
      } catch (e) {}
    }

    // High availability string responses
    return res.status(200).json({ reply: "Aashu Malik ke Super Engine node live hain. Main bilkul active hoon, aap apna sawaal pooch sakte hain!" });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Server Sync Exception: ${err.message}` });
  }
}
