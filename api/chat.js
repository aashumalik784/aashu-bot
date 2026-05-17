export default async function handler(req, res) {
  // Set explicit clean JSON and CORS headers
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({ reply: "Hello Aashu! Main live hoon, aap apna koi bhi sawaal pooch sakte hain. 😎" });
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
3. ABSOLUTELY CLEAN OUTPUT REQUIRED: Do NOT append any server metadata, logs, engine brand names, debug texts, or bracketed footers like "Engine: Groq" or "Powered by" at the end of your text. Stop immediately after answering the user query.
`;

    // Extract the absolute last user input safely
    const lastMessage = messages[messages.length - 1] || { content: "" };
    const hasImage = !!lastMessage.image;
    
    let base64Raw = "";
    let mimeType = "image/jpeg";
    if (hasImage) {
      base64Raw = lastMessage.image.includes(",") ? lastMessage.image.split(",")[1] : lastMessage.image;
      if (lastMessage.image.includes("data:")) {
        mimeType = lastMessage.image.split(",")[0].split(":")[1].split(";")[0];
      }
    }

    // Clean formatting map for nested history states to avoid API structural crashes
    const cleanedHistory = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content || "Analyze step" }]
    }));

    // 🚀 ENGINE 1: GOOGLE GEMINI CORE (Direct Dynamic Parsing)
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage) {
          parts.push({ inlineData: { data: base64Raw, mimeType: mimeType } });
        }
        parts.push({ text: (lastMessage.content || "Process query nodes") + `\n\n[System Core Directive: ${systemPrompt}]` });

        // Build clean conversation stream
        const contentsPayload = [
          ...cleanedHistory.slice(0, -1),
          { role: "user", parts: parts }
        ];

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: contentsPayload,
            generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
          })
        });

        const geminiData = await geminiRes.json();
        let reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (reply) {
          reply = reply.replace(/\*?\(?\s*🔥?\s*Engine:\s*[^)]+\s*\)?\*?/gi, "").trim();
          return res.status(200).json({ reply });
        }
      } catch (e) { console.log("Gemini core route bypass status...", e); }
    }

    // 🚀 ENGINE 2: OPENROUTER (Ultra Intelligent Text & Vision Fallback)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        let contentPayload = hasImage ? [
          { type: "text", text: lastMessage.content || "Analyze visual architecture setup" },
          { type: "image_url", image_url: { url: lastMessage.image } }
        ] : lastMessage.content;

        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.content || "" }))
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

    // 🚀 ENGINE 3: GROQ VISION FALLBACK
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.content || "" }))
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

    // Standard high-availability dynamic text string fallback
    return res.status(200).json({ reply: "Aashu AI Node re-synced successfully! Main bilkul taiyar hoon, kripya apna sawaal dobara likhein." });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Server Sync Exception: ${err.message}` });
  }
                              }
          
