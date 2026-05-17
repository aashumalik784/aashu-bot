export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method!== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;

    if (!messages ||!Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({ reply: "Hello Aashu! Main live hoon, aap apna sawaal pooch sakte hain. 😎" });
    }

    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", weekday: "long" };
    const currentDate = new Date().toLocaleDateString("en-US", options);
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    const systemPrompt = `
You are Aashu AI Super Engine, a premier intelligent assistant created by Aashu Malik.
Current Context: Date: ${currentDate} | Time: ${currentTime} | Location: India.

CRITICAL FORMATTING RULES:
1. Whenever you provide a website link or URL, ALWAYS wrap it in markdown hyperlink format: [Click here to open](https://example.com). NEVER send raw text links inside double asterisks.
2. Respond naturally in clean Hinglish/Hindi or English. Use markdown bullet points for lists.
3. ABSOLUTELY CLEAN OUTPUT REQUIRED: Do NOT append any server metadata, logs, engine brand names, or footers at the end of your text. Stop immediately after answering the user query.
`;

    const lastMessage = messages[messages.length - 1] || { content: "" };
    const userQuery = lastMessage.content || "Hello";
    const hasImage =!!lastMessage.image;

    let base64Raw = "";
    let mimeType = "image/jpeg";
    if (hasImage) {
      base64Raw = lastMessage.image.includes(",")? lastMessage.image.split(",")[1] : lastMessage.image;
      if (lastMessage.image.includes("data:")) {
        mimeType = lastMessage.image.split(",")[0].split(":")[1].split(";")[0];
      }
    }

    // DEBUG: Check kaunsi keys mili
    const keyStatus = {
      GEMINI:!!process.env.GEMINI_API_KEY,
      GROQ:!!process.env.GROQ_API_KEY,
      OPENROUTER:!!process.env.OPENROUTER_API_KEY,
      COHERE:!!process.env.COHERE_API_KEY,
      HF:!!process.env.HF_TOKEN
    };

    // ==========================================
    // 🚀 ENGINE 1: GOOGLE GEMINI CORE
    // ==========================================
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage) {
          parts.push({ inlineData: { data: base64Raw, mimeType: mimeType } });
        }
        parts.push({ text: `System Instruction: ${systemPrompt}\n\nUser Question: ${userQuery}` });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: parts }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
          })
        });

        if (!geminiRes.ok) {
          const errorData = await geminiRes.json();
          throw new Error(`HTTP ${geminiRes.status}: ${errorData.error?.message || 'Unknown error'}`);
        }

        const geminiData = await geminiRes.json();
        let reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply.trim() });
        throw new Error("Gemini se khali response aaya");
      } catch (e) {
        return res.status(200).json({ reply: `GEMINI ERROR: ${e.message}\n\nKey Status: ${JSON.stringify(keyStatus)}` });
      }
    }

    // ==========================================
    // 🚀 ENGINE 2: GROQ VISION FALLBACK
    // ==========================================
    if (process.env.GROQ_API_KEY) {
      try {
        let contentPayload = hasImage? [
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

        if (!groqRes.ok) {
          const errorData = await groqRes.json();
          throw new Error(`HTTP ${groqRes.status}: ${errorData.error?.message || 'Unknown error'}`);
        }

        const groqData = await groqRes.json();
        let reply = groqData?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
        throw new Error("Groq se khali response aaya");
      } catch (e) {
        return res.status(200).json({ reply: `GROQ ERROR: ${e.message}\n\nKey Status: ${JSON.stringify(keyStatus)}` });
      }
    }

    // ==========================================
    // 🚀 ENGINE 3: OPENROUTER FALLBACK
    // ==========================================
    if (process.env.OPENROUTER_API_KEY) {
      try {
        let contentPayload = hasImage? [
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
            model: "google/gemini-flash-1.5",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: contentPayload }
            ]
          })
        });

        if (!openRouterRes.ok) {
          const errorData = await openRouterRes.json();
          throw new Error(`HTTP ${openRouterRes.status}: ${errorData.error?.message || 'Unknown error'}`);
        }

        const orData = await openRouterRes.json();
        let reply = orData?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
        throw new Error("OpenRouter se khali response aaya");
      } catch (e) {
        return res.status(200).json({ reply: `OPENROUTER ERROR: ${e.message}\n\nKey Status: ${JSON.stringify(keyStatus)}` });
      }
    }

    // ==========================================
    // 🚀 ENGINE 4: COHERE COMMAND FALLBACK
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

        if (!cohereRes.ok) {
          const errorData = await cohereRes.json();
          throw new Error(`HTTP ${cohereRes.status}: ${errorData.message || 'Unknown error'}`);
        }

        const cohereData = await cohereRes.json();
        let reply = cohereData?.text;
        if (reply) return res.status(200).json({ reply: reply.trim() });
        throw new Error("Cohere se khali response aaya");
      } catch (e) {
        return res.status(200).json({ reply: `COHERE ERROR: ${e.message}\n\nKey Status: ${JSON.stringify(keyStatus)}` });
      }
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
            parameters: { max_new_tokens: 1024, temperature: 0.5 }
          })
        });

        if (!hfRes.ok) {
          const errorData = await hfRes.json();
          throw new Error(`HTTP ${hfRes.status}: ${errorData.error || 'Unknown error'}`);
        }

        const hfData = await hfRes.json();
        let reply = hfData?.[0]?.generated_text;
        if (reply) {
          if (reply.includes("<|assistant|>\n")) {
            reply = reply.split("<|assistant|>\n")[1];
          }
          return res.status(200).json({ reply: reply.trim() });
        }
        throw new Error("HuggingFace se khali response aaya");
      } catch (e) {
        return res.status(200).json({ reply: `HF ERROR: ${e.message}\n\nKey Status: ${JSON.stringify(keyStatus)}` });
      }
    }

    return res.status(200).json({
      reply: `KOI BHI API KEY NAHI MILI VERCEL PE!\n\nKey Status: ${JSON.stringify(keyStatus)}\n\nVercel → Settings → Environment Variables check kar aur Production tick karke Redeploy kar.`
    });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ SERVER CRASH: ${err.message}` });
  }
                                                }
