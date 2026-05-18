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

    // IMAGE GENERATION - IMPROVED DETECTION + LOGGING
    const imageKeywords = ['prompt:', 'generate image', 'create image', 'draw', 'picture of', 'photo of', 'image banao', 'tasveer banao', 'portrait', 'bhej image', 'image do', 'cyberpunk', 'futuristic'];
    const isImageRequest = imageKeywords.some(kw => userMessage.toLowerCase().includes(kw));

    console.log('Is Image Request:', isImageRequest, 'Message:', userMessage);

    if (isImageRequest) {
      console.log('HF_TOKEN exists:',!!process.env.HF_TOKEN);

      if (!process.env.HF_TOKEN) {
        return res.status(200).json({
          reply: `❌ HF_TOKEN set nahi hai Vercel me.\n\nFix: Vercel → Settings → Environment Variables me HF_TOKEN add karo.`
        });
      }

      try {
        const prompt = userMessage.replace(/prompt:|bhej|image banao|tasveer banao/gi, '').trim();
        console.log('HF Prompt:', prompt);

        const hfRes = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { negative_prompt: 'blurry, bad quality' }
          })
        });

        console.log('HF Status:', hfRes.status);

        if (!hfRes.ok) {
          const errText = await hfRes.text();
          console.log('HF Error:', errText);
          if (hfRes.status === 503) {
            return res.status(200).json({ reply: `⏳ HF Model jag raha hai. 20 second baad phir "${prompt}" bhej.` });
          }
          if (hfRes.status === 401) {
            return res.status(200).json({ reply: `❌ HF_TOKEN galat hai. huggingface.co/settings/tokens se naya bana.` });
          }
          if (hfRes.status === 429) {
            return res.status(200).json({ reply: `❌ Aaj ka free quota khatam. Kal subah 5:30 AM ke baad try kar.` });
          }
          return res.status(200).json({ reply: `❌ HF Error ${hfRes.status}: ${errText.substring(0, 100)}` });
        }

        const imageBuffer = await hfRes.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Image}`;
        console.log('Image generated successfully');

        return res.status(200).json({
          reply: `Ye lo bhai: "${prompt}"`,
          image: imageUrl
        });
      } catch (e) {
        console.log('HF Catch Error:', e.message);
        return res.status(200).json({
          reply: `❌ Image Error: ${e.message}`
        });
      }
    }

    const currentTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const systemPrompt = `You are Aashu AI, created by Aashu Malik. Current: ${currentTime}. Give accurate, concise Hinglish answers. Never repeat.`;

    // GEMINI
    if (process.env.GEMINI_API_KEY) {
      try {
        const parts = [];
        if (hasImage && lastImage.includes(',')) {
          const base64Data = lastImage.split(',')[1];
          const mimeType = lastImage.split(';')[0].split(':')[1] || 'image/jpeg';
          parts.push({ inlineData: { data: base64Data, mimeType } });
        }
        parts.push({ text: `${systemPrompt}\n\nUser: ${userMessage}` });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
          })
        });

        if (!geminiRes.ok) throw new Error(`GEMINI ${geminiRes.status}`);
        const data = await geminiRes.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) {
        console.log('GEMINI Error:', e.message);
      }
    }

    // GROQ
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

        if (!groqRes.ok) throw new Error(`GROQ ${groqRes.status}`);
        const data = await groqRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return res.status(200).json({ reply: reply.trim() });
      } catch (e) {
        console.log('GROQ Error:', e.message);
      }
    }

    return res.status(200).json({ reply: `❌ Sab API fail ho gaye. Keys check karo.` });

  } catch (err) {
    console.log('CRASH:', err.message);
    return res.status(200).json({ reply: `⚠️ SERVER CRASH: ${err.message}` });
  }
    }
