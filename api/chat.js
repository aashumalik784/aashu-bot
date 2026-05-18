export default async function handler(req, res) {
  // CORS + JSON headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method!== 'POST') {
    return res.status(405).json({ reply: 'Only POST allowed' });
  }

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages)? body.messages : [];
    const lastMsg = messages.length > 0? messages[messages.length - 1] : {};
    const userMessage = body.userMessage || lastMsg.content || '';
    const hasImage =!!lastMsg.image;
    const lastImage = lastMsg.image || '';

    // Khali message pe welcome bhej do
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

    // 1. IMAGE GENERATION - HUGGING FACE SDXL
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
            parameters: {
              negative_prompt: 'blurry, bad quality, distorted, ugly',
              num_inference_steps: 30
            }
          })
        });

        if (!hfRes.ok) {
          const errText = await hfRes.text();
          throw new Error(`HF ${hfRes.status}: ${errText.substring(0, 100)}`);
        }

        const imageBuffer = await hfRes.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Image}`;

        return res.status(200).json({
          reply: `Ye lo bhai aapki image:`,
          image: imageUrl
        });
      } catch (e) {
        return res.status(200).json({
          reply: `Image nahi bana paya 😓\nReason: ${e.message}\n\nFix: HuggingFace token check karo ya 1 min baad try karo. Free quota khatam ho sakta hai.`
        });
      }
    }

    const systemPrompt = `You are Aashu AI, a helpful assistant created by Aashu Malik.
Current Time: ${currentTime}
Location: India

CRITICAL RULES:
1. Give accurate, concise answers. DO NOT repeat sentences or paragraphs.
2. For real-time data like YouTube trends, population, news - say "Mere paas live data nahi hai, par latest estimate ye hai:" then answer.
3. World population 2026 estimate: ~8.1 billion. India: ~1.45 billion.
4. Reply in clean Hinglish. Use markdown bullet points for lists.
5. NEVER add footers, logs, or repeat yourself. Stop after answering.`;

    const errors = [];
    const keys = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
    };

    const availableKeys = Object.entries(keys).filter(([k, v]) => v && v.trim()!== '');

    if (availableKeys.length === 0) {
      return res.status(200).json({
        reply: `❌ VERCEL ME KOI BHI API KEY SET NAHI HAI\n\nVercel → Settings → Environment Variables me ye add karo:\nGROQ_API_KEY = apni_key\nHF_TOKEN = apni_key\n\nTeeno environment tick karo: Production, Preview, Development`
      });
    }

    // 2. GROQ - 70B SMART MODEL
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
             ...messages.slice(-6), // Last 6 messages for context
              { role: 'user', content: userMessage }
            ],
            temperature: 0.3, // Low temp = kam repetition
            max_tokens: 1500
          })
        });

        if (!groqRes.ok) {
          const errText = await groqRes.text();
          throw new Error(`GROQ ${groqRes.status}: ${errText}`);
        }

        const data = await groqRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && reply.trim()) {
          return res.status(200).json({ reply: reply.trim() });
        }
        throw new Error('GROQ: Empty response');
      } catch (e) {
        errors.push(e.message.substring(0, 200));
      }
    }

    // 3. GEMINI FALLBACK
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage && lastImage.includes(',')) {
          const base64Data = lastImage.split(',')[1];
          const mimeType = lastImage.split(';')[0].split(':')[1] || 'image/jpeg';
          parts.push({ inlineData: { data: base64Data, mimeType } });
        }
        parts.push({ text: `${systemPrompt}\n\nUser: ${userMessage}` });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          throw new Error(`GEMINI ${geminiRes.status}: ${errText}`);
        }

        const data = await geminiRes.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim()) {
          return res.status(200).json({ reply: reply.trim() });
        }
        throw new Error('GEMINI: Empty response');
      } catch (e) {
        errors.push(e.message.substring(0, 200));
      }
    }

    // 4. OPENROUTER FALLBACK
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
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.4
          })
        });

        if (!orRes.ok) {
          const errText = await orRes.text();
          throw new Error(`OPENROUTER ${orRes.status}: ${errText}`);
        }

        const data = await orRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && reply.trim()) {
          return res.status(200).json({ reply: reply.trim() });
        }
        throw new Error('OPENROUTER: Empty response');
      } catch (e) {
        errors.push(e.message.substring(0, 200));
      }
    }

    // SAB FAIL HUA
    const keyNames = availableKeys.map(([k]) => k.replace('_API_KEY', '')).join(', ');
    return res.status(200).json({
      reply: `❌ SAB API FAIL HO GAYE\n\nErrors:\n${errors.join('\n\n')}\n\nTried Keys: ${keyNames}\n\nFix: Vercel → Settings → Environment Variables me keys check karo aur Redeploy karo.`
    });

  } catch (err) {
    return res.status(200).json({
      reply: `⚠️ SERVER CRASH: ${err.message}\n\nYe error developer ko bhejo.`
    });
  }
      }
