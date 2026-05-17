export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: "Invalid messages payload." });
    }

    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    const systemPrompt = `
You are Aashu AI Super Engine, a premier intelligent assistant created by Aashu Malik.
Current Context: Date: ${currentDate} | Time: ${currentTime} | Location: India.

CRITICAL FORMATTING RULES:
1. Whenever you provide a website link or URL, ALWAYS wrap it in standard markdown hyperlink format: [Click here to open](https://example.com) or directly [https://example.com](https://example.com). NEVER send raw text links inside double asterisks like **https://...**.
2. Respond naturally in clean Hinglish/Hindi or English. Use markdown bullet points for lists.
3. Keep the output clean. DO NOT attach any server logs, engine debug notes, or extra technical footers at the end of your response.
4. If a screenshot is uploaded, parse the text inside it thoroughly and answer seamlessly.
`;

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

    // 🚀 ROUTE 1: GOOGLE GEMINI CORE
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage) {
          parts.push({ inlineData: { data: base64Raw, mimeType: mimeType } });
        }
        parts.push({ text: (lastMessage.content || "Analyze this request") + `\n\n[System Core Framework Context: ${systemPrompt}]` });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: parts }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
          })
        });

        const geminiData = await geminiRes.json();
        const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply });
      } catch (e) {}
    }

    // 🚀 ROUTE 2: OPENROUTER FALLBACK
    if (process.env.OPENROUTER_API_KEY) {
      try {
        let contentPayload = hasImage ? [
          { type: "text", text: lastMessage.content || "Analyze this attached image content" },
          { type: "image_url", image_url: { url: lastMessage.image } }
        ] : lastMessage.content;

        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: contentPayload }]
          })
        });
        const orData = await openRouterRes.json();
        const reply = orData?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply });
      } catch (e) {}
    }

    // 🚀 ROUTE 3: GROQ VISION FALLBACK
    if (process.env.GROQ_API_KEY) {
      try {
        let contentPayload = hasImage ? [
          { type: "text", text: lastMessage.content || "Analyze layout details" },
          { type: "image_url", image_url: { url: lastMessage.image } }
        ] : lastMessage.content;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: contentPayload }],
            temperature: 0.4
          })
        });
        const groqData = await groqRes.json();
        const reply = groqData?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply });
      } catch (e) {}
    }

    return res.status(200).json({ reply: "⚠️ Network pipeline timeout. Please try sending your request again." });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Error: ${err.message}` });
  }
                                 }
        
