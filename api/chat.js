export default async function handler(req, res) {
  // Clear and strict JSON API response headers
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;
    
    // Core fallback layer if message payload array is structurally empty
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({ reply: "Hello Aashu! Main live hoon, aap apna sawaal pooch sakte hain. 😎" });
    }

    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    // Multi-Core System Directives
    const systemPrompt = `
You are Aashu AI Super Engine, a premier intelligent assistant created by Aashu Malik.
Current Context: Date: ${currentDate} | Time: ${currentTime} | Location: India.

CRITICAL FORMATTING RULES:
1. Whenever you provide a website link or URL, ALWAYS wrap it in markdown hyperlink format: [Click here to open](https://example.com). NEVER send raw text links inside double asterisks.
2. Respond naturally in clean Hinglish/Hindi or English. Use markdown bullet points for lists.
3. ABSOLUTELY CLEAN OUTPUT REQUIRED: Do NOT append any server metadata, logs, engine brand names, or footers at the end of your text. Stop immediately after answering the user query.
`;

    // Safely extract the last user message block to prevent multi-array crashes
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
    // 🚀 ENGINE 1: GOOGLE GEMINI CORE (`GEMINI_API_KEY`)
    // ==========================================
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage) {
          parts.push({ inlineData: { data: base64Raw, mimeType: mimeType } });
        }
        // ✅ FIXED: System Instruction aur User Query ko sahi format mein alag kiya taaki Gemini reject na kare
        parts.push({ text: `System Instruction: ${systemPrompt}\n\nUser Question: ${userQuery}` });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: parts }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
          })
        });

        const geminiData = await geminiRes.json();
        let reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) { console.log("Gemini bypass...", e.message); }
    }

    // ==========================================
    // 🚀 ENGINE 2: GROQ VISION FALLBACK (`GROQ_API_KEY`)
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
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) { console.log("Groq bypass...", e.message); }
    }

    // ==========================================
    // 🚀 ENGINE 3: OPENROUTER FALLBACK (`OPENROUTER_API_KEY`)
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
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) { console.log("OpenRouter bypass...", e.message); }
    }

    // ==========================================
    // 🚀 ENGINE 4: COHERE COMMAND LIGHT FALLBACK (`COHERE_API_KEY`)
    // ==========================================
    if (process.env.COHERE_API_KEY) {
      try {
        const cohereRes = await fetch("https://api.cohere.ai/v1/chat", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "command-r-plus",
            message: userQuery,
            preamble: systemPrompt,
            temperature: 0.4
          })
        });
        const cohereData = await cohereRes.json();
        let reply = cohereData?.text;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) { console.log("Cohere bypass...", e.message); }
    }

    // ==========================================
    // 🚀 ENGINE 5: HUGGING FACE INFERENCE FALLBACK (`HF_TOKEN`)
    // ==========================================
    if (process.env.HF_TOKEN) {
      try {
        const hfRes = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HF_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: `<|system|>\n${systemPrompt}\n<|user|>\n${userQuery}\n<|assistant|>\n`,
            parameters: { max_new_tokens: 1024, temperature: 0.5 }
          })
        });
        const hfData = await hfRes.json();
        let reply = hfData?.[0]?.generated_text;
        if (reply) {
          if (reply.includes("<|assistant|>\n")) {
            reply = reply.split("<|assistant|>\n")[1];
          }
          return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) { console.log("HuggingFace bypass...", e.message); }
    }

    // ✅ FIXED: Agar saare engine bypass ho jayein, toh user ko bataye ki API key check karein, na ki purana ready state loop chalaye
    return res.status(200).json({ reply: "Bhai lagta hai saare API providers down hain ya Vercel par Environment Keys missing hain! Apni settings check karo." });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Server Sync Exception: ${err.message}` });
  }
          }
      
