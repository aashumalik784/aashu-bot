export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') return res.status(405).json({ reply: 'Only POST allowed' });

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages)? body.messages : [];
    const lastMsg = messages.length > 0? messages[messages.length - 1] : {};
    const userMessage = body.userMessage || lastMsg.content || '';

    if (!userMessage) {
      return res.status(200).json({
        reply: 'Hello Aashu! Main live hoon, aap apna sawaal pooch sakte hain. 😎'
      });
    }

    const currentTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // IMAGE GENERATION - HF SDXL
    const imageKeywords = ['prompt:', 'generate image', 'create image', 'draw', 'picture of', 'photo of', 'image banao', 'tasveer banao', 'bhej image', 'image do', 'cyberpunk', 'futuristic'];
    const isImageRequest = imageKeywords.some(kw => userMessage.toLowerCase().includes(kw));

    if (isImageRequest && process.env.HF_TOKEN) {
      try {
        const prompt = userMessage.replace(/prompt:|bhej|image banao|tasveer banao/gi, '').trim();
        const hfRes = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: prompt })
        });

        if (!hfRes.ok) {
          const errText = await hfRes.text();
          if (hfRes.status === 503) return res.status(200).json({ reply: `⏳ HF Model load ho raha hai. 20 sec baad "${prompt}" phir bhej.` });
          if (hfRes.status === 401) return res.status(200).json({ reply: `❌ HF_TOKEN galat hai.` });
          if (hfRes.status === 429) return res.status(200).json({ reply: `❌ Aaj ka free quota khatam. Kal try kar.` });
          return res.status(200).json({ reply: `❌ HF Error ${hfRes.status}` });
        }

        const imageBuffer = await hfRes.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        return res.status(200).json({
          reply: `Ye lo: "${prompt}"`,
          image: `data:image/png;base64,${base64Image}`
        });
      } catch (e) {
        return res.status(200).json({ reply: `❌ Image Error: ${e.message}` });
      }
    }

    const systemPrompt = `You are Aashu AI, created by Aashu Malik. Current: ${currentTime}. Give accurate, concise Hinglish answers. For real-time data say "Mere paas live data nahi hai, par latest estimate ye hai:". Never repeat.`;

    // GEMINI - FIXED NAME
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
          })
        });
        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    // GROQ - FIXED NO IMAGE FIELD
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
          ...messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: userMessage }
            ],
            temperature: 0.3,
            max_tokens: 1500
          })
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    return res.status(200).json({ reply: `❌ Sab API fail. Keys check karo.` });
  } catch (err) {
    return res.status(200).json({ reply: `⚠️ SERVER CRASH: ${err.message}` });
  }
}
