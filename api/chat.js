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

    // 🔴 CRITICAL: Is neeche waali line mein quote "" ke andar apni asli Gemini API Key daal do
    // Jaise: const DIRECT_GEMINI_KEY = "AIzaSyAz... Your Key Here";
    const DIRECT_GEMINI_KEY = "YOUR_GEMINI_API_KEY_HERE"; 

    const systemPrompt = `
You are Aashu AI Super Engine, a premier intelligent assistant created by Aashu Malik.
Respond naturally in clean Hinglish or English. Use markdown bullet points for lists.
If a website link is requested, wrap it in markdown format: [Click here to open](https://example.com).
`;

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

    // Direct Fetch Core - No Vercel Variable Needed
    try {
      const parts = [];
      if (hasImage) {
        parts.push({ inlineData: { data: base64Raw, mimeType: mimeType } });
      }
      parts.push({ text: userQuery + `\n\n[System Context: ${systemPrompt}]` });

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${DIRECT_GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: parts }] })
      });

      const geminiData = await geminiRes.json();
      
      if (geminiData?.error) {
        return res.status(200).json({ reply: `❌ API Error: ${geminiData.error.message}` });
      }

      const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return res.status(200).json({ reply: reply.trim() });
    } catch (e) {
      return res.status(200).json({ reply: `❌ Connection Error: ${e.message}` });
    }

    return res.status(200).json({ reply: "Aashu AI Console ready. Main bilkul active hoon!" });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ Server Sync Exception: ${err.message}` });
  }
}
