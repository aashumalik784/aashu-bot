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
    const hasImage =!!lastMsg.image;
    const lastImage = lastMsg.image || '';

    if (!userMessage &&!hasImage) {
      return res.status(200).json({
        reply: 'Hello Aashu! Main live hoon, aap apna sawaal pooch sakte hain. 😎'
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

    // Image generation check
    const imageKeywords = ['generate image', 'create image', 'draw', 'picture of', 'photo of', 'image banao', 'tasveer banao', 'portrait', 'Prompt:'];
    const isImageRequest = imageKeywords.some(kw => userMessage.toLowerCase().includes(kw));

    // 1. IMAGE GENERATION - HUGGING FACE
    if (isImageRequest && process.env.HF_TOKEN) {
      try {
        const prompt = userMessage.replace('Prompt:', '').trim();
        const hfRes = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { negative_prompt: 'blurry, bad quality, distorted' }
          })
        });

        if (!hfRes.ok) throw new Error(`HF ${hfRes.status}: ${await hfRes.text()}`);

        const imageBuffer = await hfRes.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Image}`;

        return res.status(200).json({
          reply: `Ye rahi aapki image:`,
          image: imageUrl
        });
      } catch (e) {
        return res.status(200).json({
          reply: `Image nahi bana paya 😓\nReason: ${e.message.substring(0, 150)}\n\nHuggingFace quota khatam ho sakta hai. 1 min baad try karo.`
        });
      }
    }

    const systemPrompt = `You are Aashu AI, created by Aashu Malik. Current: ${currentTime}.
RULES:
1. Give accurate, concise answers. DO NOT repeat sentences.
2. For real-time data like YouTube trends, population - say "Mere paas live data nahi hai, par latest estimate ye hai:" then answer.
3. World population 2026 estimate: ~8.1 billion. India: ~1.45 billion.
4. Reply in Hinglish. Use markdown for lists.
5. NEVER add footers or repeat yourself.`;

    const errors = [];

    // 2. GEMINI - FIXED MODEL NAME
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage && lastImage.includes(',')) {
          const base64Data = lastImage.split(',')[1];
          const mimeType = lastImage.split(';')[0].split(':')[1] || 'image/jpeg';
          parts.push({ inlineData: { data: base64Data, mimeType } });
        }
        parts.push({ text: `${systemPrompt}\n\nUser: ${userMessage}` });

        // FIXED: gemini-1.5-flash-latest -> gemini-1.5-flash
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
          })
        });

        if (!geminiRes.ok) throw new Error(`GEMINI ${geminiRes.status}: ${await geminiRes.text()}`);
        const data = await geminiRes.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) {
        errors.push(e.message.substring(0, 200));
      }
    }

    // 3. GROQ - FIXED: IMAGE HATA DIYA
    if (process.env.GROQ_API_KEY) {
      try {
        // FIXED: GROQ ko image nahi bhejte, sirf text
        const groqMessages = [
          { role: 'system', content: systemPrompt },
        ...messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content // image field hata diya
          })),
          { role: 'user', content: userMessage }
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.3,
            max_tokens: 1500
          })
        });

        if (!groqRes.ok) throw new Error(`GROQ ${groqRes.status}: ${await groqRes.text()}`);
        const data = await groqRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) {
        errors.push(e.message.substring(0, 200));
      }
    }

    // 4. OPENROUTER - FIXED MODEL NAME
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://aashu-bot.vercel.app',
            'X-Title': 'Aashu AI'
          },
          body: JSON.stringify({
            model: 'google/gemini-flash-1.5-8b', // Naya free model
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.4
          })
        });

        if (!orRes.ok) throw new Error(`OPENROUTER ${orRes.status}: ${await orRes.text()}`);
        const data = await orRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) {
        errors.push(e.message.substring(0, 200));
      }
    }

    return res.status(200).json({
      reply: `❌ SAB API FAIL HO GAYE\n\nErrors:\n${errors.join('\n\n')}\n\nFix: Keys check karo. GEMINI_API_KEY aur GROQ_API_KEY sahi hain kya?`
    });

  } catch (err) {
    return res.status(200).json({
      reply: `⚠️ SERVER CRASH: ${err.message}`
    });
  }
        }
