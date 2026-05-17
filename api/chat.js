export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages, userProfile } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: "Invalid messages format." });
    }

    // 🕒 Live Date & Time Setup (IST)
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    const systemPrompt = `
You are Aashu AI Super Engine, an elite hybrid AI built by Aashu Malik. You combine the vision, coding, and reasoning cores of Gemini, Claude, GPT-4, and DeepSeek.
Current Context: Date: ${currentDate} | Time: ${currentTime} | Location: India.
Rules: Respond naturally in friendly Hinglish/Hindi or English. Use markdown bullets for lists. 
CRITICAL: If a screenshot or image is attached, look at it thoroughly, read all the text/code inside it, and explain or answer flawlessly based on that visual data.
`;

    const lastMessage = messages[messages.length - 1] || { content: "" };
    const hasImage = !!lastMessage.image;
    
    // Extract base64 clean data and mime type for various vision APIs
    let base64Raw = "";
    let mimeType = "image/jpeg";
    if (hasImage) {
      base64Raw = lastMessage.image.split(",")[1];
      mimeType = lastMessage.image.split(",")[0].split(":")[1].split(";")[0];
    }

    // ==========================================
    // 🚀 ENGINE 1: GOOGLE GEMINI (Vision + Text Core)
    // ==========================================
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage) {
          parts.push({
            inlineData: { data: base64Raw, mimeType: mimeType }
          });
        }
        parts.push({ text: lastMessage.content || "Analyze this request" });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: parts }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.5, maxOutputTokens: 2048 }
          })
        });

        const geminiData = await geminiRes.json();
        const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply + "\n\n*(⚡ Engine: Google Gemini)*" });
      } catch (e) { console.log("Gemini Engine Error, shifting gears...", e); }
    }

    // ==========================================
    // 🚀 ENGINE 2: OPENROUTER (Vision-Ready Fallback Core)
    // ==========================================
    if (process.env.OPENROUTER_API_KEY) {
      try {
        let contentPayload;
        if (hasImage) {
          contentPayload = [
            { type: "text", text: lastMessage.content || "Analyze this attached screenshot" },
            { type: "image_url", image_url: { url: lastMessage.image } }
          ];
        } else {
          contentPayload = lastMessage.content;
        }

        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash", // OpenRouter's highly reliable fallback vision core
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: contentPayload }
            ]
          })
        });
        const orData = await openRouterRes.json();
        const reply = orData?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply + "\n\n*(🚀 Engine: OpenRouter Vision Hub)*" });
      } catch (e) { console.log("OpenRouter Engine Error, shifting gears...", e); }
    }

    // ==========================================
    // 🚀 ENGINE 3: GROQ (Production Live Vision Block)
    // ==========================================
    if (process.env.GROQ_API_KEY) {
      try {
        let contentPayload;
        if (hasImage) {
          contentPayload = [
            { type: "text", text: lastMessage.content || "Analyze this image layout" },
            { type: "image_url", image_url: { url: lastMessage.image } }
          ];
        } else {
          contentPayload = lastMessage.content;
        }

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview", // Active live vision core
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: contentPayload }
            ],
            temperature: 0.5
          })
        });
        const groqData = await groqRes.json();
        const reply = groqData?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply + "\n\n*(🔥 Engine: Groq Llama Vision)*" });
      } catch (e) { console.log("Groq Engine Error, shifting gears...", e); }
    }

    // ==========================================
    // 🚀 ENGINE 4: COHERE & HUGGING FACE (Pure Text Fallbacks)
    // ==========================================
    if (!hasImage) {
      if (process.env.COHERE_API_KEY) {
        try {
          const cohereRes = await fetch("https://api.cohere.ai/v1/chat", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.COHERE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "command-r", message: lastMessage.content, preamble: systemPrompt })
          });
          const cohereData = await cohereRes.json();
          if (cohereData?.text) return res.status(200).json({ reply: cohereData.text + "\n\n*(📝 Engine: Cohere Command)*" });
        } catch (e) {}
      }

      if (process.env.HF_TOKEN) {
        try {
          const hfRes = await fetch("https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: lastMessage.content })
          });
          const hfData = await hfRes.json();
          const reply = hfData?.[0]?.generated_text || hfData?.generated_text;
          if (reply) return res.status(200).json({ reply: reply + "\n\n*(📂 Engine: Hugging Face)*" });
        } catch (e) {}
      }
    }

    return res.status(200).json({ reply: "⚠️ Super Engine Note: Saare global servers busy hain. Kripya ek baar dobara send karein!" });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Critical Core Error: ${err.message}` });
  }
                                             }
               
