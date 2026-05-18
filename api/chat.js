export default async function handler(req, res) {
  // CORS + JSON headers
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
    const hasImage =!!lastMsg.image;
    const lastImage = lastMsg.image || '';

    if (!userMessage &&!hasImage) {
      return res.status(200).json({
        reply: 'Hello Aashu! Main live hoon, aap apna sawaal pooch sakte hain. 😎'
      });
    }

    const errors = [];
    const keys = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      COHERE_API_KEY: process.env.COHERE_API_KEY,
      HF_TOKEN: process.env.HF_TOKEN
    };

    const availableKeys = Object.entries(keys).filter(([k, v]) => v && v.trim()!== '');

    if (availableKeys.length === 0) {
      return res.status(200).json({
        reply: `❌ VERCEL ME KOI BHI API KEY SET NAHI HAI\n\nVercel → Settings → Environment Variables me GROQ_API_KEY add karo.\n\nPhir Redeploy karo.`
      });
    }

    const currentTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const systemPrompt = `You are Aashu AI, created by Aashu Malik. Reply in Hinglish. Current: ${currentTime}. Never add footers or logs.`;

    // 1. GEMINI TRY
    if (keys.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage && lastImage.includes(',')) {
          const base64Data = lastImage.split(',')[1];
          const mimeType = lastImage.split(';')[0].split(':')[1] || 'image/jpeg';
          parts.push({ inlineData: { data: base64Data, mimeType } });
        }
        parts.push({ text: `${systemPrompt}\n\nUser: ${userMessage}` });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${keys.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts }] })
        });

        if (!geminiRes.ok) throw new Error(`GEMINI ${geminiRes.status}: ${await geminiRes.text()}`);
        const data = await geminiRes.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) { errors.push(e.message.substring(0, 200)); }
    }

    // 2. GROQ TRY
    if (keys.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${keys.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
            temperature: 0.7
          })
        });
        if (!groqRes.ok) throw new Error(`GROQ ${groqRes.status}: ${await groqRes.text()}`);
        const data = await groqRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) { errors.push(e.message.substring(0, 200)); }
    }

    // 3. OPENROUTER TRY
    if (keys.OPENROUTER_API_KEY) {
      try {
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${keys.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://aashu-bot.vercel.app',
            'X-Title': 'Aashu AI'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }]
          })
        });
        if (!orRes.ok) throw new Error(`OPENROUTER ${orRes.status}: ${await orRes.text()}`);
        const data = await orRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) { errors.push(e.message.substring(0, 200)); }
    }

    // SAB FAIL
    const keyNames = availableKeys.map(([k]) => k.replace('_API_KEY', '').replace('_TOKEN', '')).join(', ');
    return res.status(200).json({
      reply: `❌ SAB FAIL HUA\n\nErrors:\n${errors.join('\n\n')}\n\nTried Keys: ${keyNames}\n\nCheck: Vercel → Settings → Environment Variables`
    });

  } catch (err) {
    return res.status(200).json({ reply: `⚠️ SERVER CRASH: ${err.message}` });
  }
                        }
