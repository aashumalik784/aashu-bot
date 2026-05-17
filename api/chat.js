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

    const systemPrompt = "You are Aashu AI Super Engine, created by Aashu Malik. Respond naturally in clean Hinglish or English.";
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
        // AGAR KEY INVALID HAI TOH ERROR RETURN NAHI KARENGE, AGLE ENGINE PAR JAYENGE
        if (!geminiData?.error) {
          const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
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
        if (!groqData?.error) {
          const reply = groqData?.choices?.[0]?.message?.content;
          if (reply) return res.status(200).json({ reply: reply.trim() });
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
        if (!orData?.error) {
          const reply = orData?.choices?.[0]?.message?.content;
          if (reply) return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    // ==========================================
    // 🚀 ENGINE 4: COHERE FALLBACK
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
            preamble: systemPrompt
          })
        });
        const cohereData = await cohereRes.json();
        if (!cohereData?.error) {
          const reply = cohereData?.text;
          if (reply) return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    // ==========================================
    // 🚀 ENGINE 5: HUGGING FACE FALLBACK
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
            parameters: { max_new_tokens: 512, temperature: 0.5 }
          })
        });
        const hfData = await hfRes.json();
        let reply = hfData?.[0]?.generated_text;
        if (reply) {
          if (reply.includes("<|assistant|>\n")) reply = reply.split("<|assistant|>\n")[1];
          return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    return res.status(200).json({ reply: "Aashu AI Multi-Core Smart Standby Mode. Kripya apni API keys ki validity check karein!" });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Connection Exception: ${err.message}` });
  }
          }
          
