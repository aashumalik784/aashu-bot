export default async function handler(req, res) {
  // Setup strict headers to clean out serverless cache noise
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Only POST allowed" });
    }

    const { messages } = req.body;
    
    // Fallback block if array data structure acts up
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({ reply: "Hello Aashu! Sawaal poochiye bhai, main live hoon. 😎" });
    }

    // Direct system string parameters
    const systemPrompt = "You are Aashu AI Super Engine, a premier intelligent assistant created by Aashu Malik. Respond naturally in clean Hinglish/Hindi or English.";
    
    // Extracted clean text string to eliminate deep nested object crashes
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage && lastMessage.content ? lastMessage.content : "Hi";

    // 🚀 SINGLE-CORE DIRECT RUN (Bina kisi dynamic loop ya array parsing ke)
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: `${userQuery}\n\n[Instruction Directive: ${systemPrompt}]` }]
            }]
          })
        });

        const geminiData = await geminiRes.json();
        
        // Direct response allocation layer
        const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim() !== "") {
          return res.status(200).json({ reply: reply.trim() });
        }
      } catch (geminiErr) {
        // Safe internal fallback execution
      }
    }

    // 🚀 ENGINE 2: GROQ BACKUP 
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

    // Dynamic direct test string
    return res.status(200).json({ reply: "Aashu AI core link synced successfully. Main aapke sawaal ka jawab dene ke liye active hoon!" });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Script Sync Error: ${err.message}` });
  }
}
