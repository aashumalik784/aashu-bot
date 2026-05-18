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
    const userMessage = body.userMessage || messages[messages.length - 1]?.content || '';
    const lowerMsg = userMessage.toLowerCase();

    if (!userMessage) {
      return res.status(200).json({
        reply: 'Namaste! Main **Aashu AI Bot** hoon 😎\n\nMere features:\n✅ Image Generator\n✅ Video Generator 2-sec\n✅ Live Mausam\n✅ Crypto Price\n✅ News Updates\n✅ 2030 Tak Ka Gyaan\n\nKuch bhi poocho!'
      });
    }

    const currentTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // ==================== 1. IMAGE GENERATION ====================
    const imageKeywords = ['image banao', 'tasveer banao', 'photo banao', 'picture', 'draw', 'generate image', 'dikhaiye', 'portrait', 'banner', 'poster'];
    if (imageKeywords.some(kw => lowerMsg.includes(kw))) {
      if (!process.env.HF_TOKEN) {
        return res.status(200).json({ reply: '❌ Image banane ke liye Vercel me HF_TOKEN add karo.' });
      }
      try {
        const prompt = userMessage.replace(/image banao|tasveer banao|photo banao|picture|draw|generate image|dikhaiye|portrait|banner|poster/gi, '').trim();
        const hfRes = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { negative_prompt: 'blurry, bad quality, distorted' }
          })
        });

        if (hfRes.status === 503) return res.status(200).json({ reply: `⏳ Image model load ho raha hai. 20 second baad "${prompt}" phir bhej.` });
        if (hfRes.status === 429) return res.status(200).json({ reply: `❌ Aaj ka free image quota khatam. Kal subah 5:30 AM ke baad try karo.` });
        if (!hfRes.ok) return res.status(200).json({ reply: `❌ Image Error ${hfRes.status}. HF_TOKEN check karo.` });

        const imageBuffer = await hfRes.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        return res.status(200).json({
          reply: `✅ Image ready: "${prompt}"`,
          image: `data:image/png;base64,${base64Image}`
        });
      } catch (e) {
        return res.status(200).json({ reply: `❌ Image fail: ${e.message}` });
      }
    }

    // ==================== 2. VIDEO GENERATION ====================
    const videoKeywords = ['video banao', 'video generate', 'animation banao', 'clip banao', 'short video', 'reel banao'];
    if (videoKeywords.some(kw => lowerMsg.includes(kw))) {
      if (!process.env.HF_TOKEN) {
        return res.status(200).json({ reply: '❌ Video banane ke liye Vercel me HF_TOKEN add karo.' });
      }
      try {
        const prompt = userMessage.replace(/video banao|video generate|animation banao|clip banao|short video|reel banao/gi, '').trim();
        const hfRes = await fetch('https://api-inference.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: prompt })
        });

        if (hfRes.status === 503) return res.status(200).json({ reply: `⏳ Video model jag raha hai. 1 minute lagega. Phir try karo.` });
        if (hfRes.status === 429) return res.status(200).json({ reply: `❌ Video quota khatam. Din me 10 video free milti hai.` });
        if (!hfRes.ok) return res.status(200).json({ reply: `❌ Video Error ${hfRes.status}` });

        const videoBuffer = await hfRes.arrayBuffer();
        const base64Video = Buffer.from(videoBuffer).toString('base64');
        return res.status(200).json({
          reply: `✅ 2-sec Video ready: "${prompt}"\n⚠️ Note: Free me sirf 2 sec ki video banti hai.`,
          video: `data:video/mp4;base64,${base64Video}`
        });
      } catch (e) {
        return res.status(200).json({ reply: `❌ Video fail: ${e.message}` });
      }
    }

    // ==================== 3. LIVE WEATHER ====================
    if (lowerMsg.includes('mausam') || lowerMsg.includes('weather') || lowerMsg.includes('taapmaan') || lowerMsg.includes('temperature')) {
      try {
        const cityMatch = userMessage.match(/(?:in|ka|ki|me|of)\s+([a-zA-Z]+)|([a-zA-Z]+)\s+(?:ka|ki|me)|^([a-zA-Z]+)$/i);
        const city = cityMatch?.[1] || cityMatch?.[2] || cityMatch?.[3] || 'Khurja';
        const weatherRes = await fetch(`https://wttr.in/${city}?format=j1`);
        if (weatherRes.ok) {
          const d = await weatherRes.json();
          const c = d.current_condition[0];
          const today = d.weather[0];
          return res.status(200).json({
            reply: `📍 **${city} - Live Mausam**\n\n🌡️ **Abhi**: ${c.temp_C}°C | Feels like ${c.FeelsLikeC}°C\n☁️ **Condition**: ${c.weatherDesc[0].value}\n💧 **Humidity**: ${c.humidity}%\n💨 **Hawa**: ${c.windspeedKmph} km/h\n🌅 **Aaj Max/Min**: ${today.maxtempC}°C / ${today.mintempC}°C\n\n⏰ ${currentTime}`
          });
        }
      } catch (e) {}
    }

    // ==================== 4. LIVE CRYPTO ====================
    if (lowerMsg.includes('bitcoin') || lowerMsg.includes('btc') || lowerMsg.includes('ethereum') || lowerMsg.includes('crypto') || lowerMsg.includes('dollar') || lowerMsg.includes('bhav')) {
      try {
        const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana&vs_currencies=inr,usd&include_24hr_change=true');
        if (cryptoRes.ok) {
          const d = await cryptoRes.json();
          return res.status(200).json({
            reply: `💰 **Live Crypto Rates**\n\n**Bitcoin**: ₹${d.bitcoin.inr.toLocaleString('en-IN')} | $${d.bitcoin.usd.toLocaleString()} (${d.bitcoin.inr_24h_change.toFixed(2)}%)\n**Ethereum**: ₹${d.ethereum.inr.toLocaleString('en-IN')} | $${d.ethereum.usd.toLocaleString()} (${d.ethereum.inr_24h_change.toFixed(2)}%)\n**Solana**: ₹${d.solana.inr.toLocaleString('en-IN')} | $${d.solana.usd.toLocaleString()}\n**USDT**: ₹${d.tether.inr}\n\n⏰ ${currentTime}\nData: CoinGecko`
          });
        }
      } catch (e) {}
    }

    // ==================== 5. LIVE NEWS ====================
    if (lowerMsg.includes('news') || lowerMsg.includes('khabar') || lowerMsg.includes('taza') || lowerMsg.includes('headlines')) {
      if (process.env.NEWS_API_KEY) {
        try {
          const newsRes = await fetch(`https://newsapi.org/v2/top-headlines?country=in&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`);
          if (newsRes.ok) {
            const data = await newsRes.json();
            const headlines = data.articles.map((a, i) => `${i+1}. **${a.title}**`).join('\n\n');
            return res.status(200).json({ reply: `📰 **Aaj ki Taza Khabar**\n\n${headlines}\n\n⏰ ${currentTime}` });
          }
        } catch (e) {}
      }
      return res.status(200).json({
        reply: `📰 **News Update**\n\nLive news ke liye Vercel me NEWS_API_KEY add karo newsapi.org se.\n\nAbhi ke liye check karo:\n1. Google News: news.google.com\n2. AajTak: aajtak.in\n\n**2030 Estimate**: AI, Climate, Space, EV trending rahenge.`
      });
    }

    // ==================== 6. DISTANCE ====================
    if (lowerMsg.includes('duri') || lowerMsg.includes('distance') || lowerMsg.includes('kitna dur')) {
      const cities = userMessage.match(/([a-zA-Z]+)\s+se\s+([a-zA-Z]+)/i);
      if (cities) {
        return res.status(200).json({
          reply: `📍 **${cities[1]} se ${cities[2]} ki duri**\n\n🚗 **Estimate**: 100-150 km | 2-4 ghante\n✈️ **Hawai duri**: ~80-120 km\n\n*Exact ke liye Google Maps dekho.*`
        });
      }
    }

    // ==================== 7. AI CHAT - 2030 TAK KA GYAAN ====================
    const systemPrompt = `You are Aashu AI Bot, created by Aashu Malik. Today: ${currentTime}.
    KNOWLEDGE: Your training data is till Jan 2024. For 2024-2030, use logical reasoning and current trends.
    RULES:
    1. Answer in Hinglish. Be accurate and concise.
    2. For future questions 2025-2030, start with "Bhavishya ka estimate:" then give logical prediction.
    3. For real-time data you don't have, say "Mere paas live data nahi hai, par latest estimate ye hai:" then answer.
    4. Never say "I don't know". Always give best estimate.
    5. Never repeat sentences. Don't use --- or ***.
    6. For math/coding, be 100% accurate.`;

    // GEMINI
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
          })
        });
        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
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
            temperature: 0.7,
            max_tokens: 2000
          })
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    // OPENROUTER BACKUP
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const openRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-flash-1.5-8b',
            messages: [{ role: 'user', content: `${systemPrompt}\n\nUser: ${userMessage}` }],
            temperature: 0.7,
            max_tokens: 2000
          })
        });
        if (openRes.ok) {
          const data = await openRes.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) return res.status(200).json({ reply: reply.trim() });
        }
      } catch (e) {}
    }

    return res.status(200).json({ reply: `❌ Sab AI fail ho gaye. Vercel me kam se kam GEMINI_API_KEY ya GROQ_API_KEY add karo.` });
  } catch (err) {
    return res.status(200).json({ reply: `⚠️ SERVER CRASH: ${err.message}` });
  }
      }
