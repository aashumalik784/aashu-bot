export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Only POST allowed' });

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userMessage = body.userMessage || messages[messages.length - 1]?.content || '';
    const lowerMsg = userMessage.toLowerCase();

    if (!userMessage) {
      return res.status(200).json({
        reply: 'Namaste! Main **Aashu AI Bot** hoon 😎\n\nMere features:\n✅ Image Generator\n✅ Video Generator 2-sec\n✅ Live Mausam\n✅ Crypto Price\n✅ News Updates\n✅ Smart Chat\n\nKuch bhi poocho!'
      });
    }

    const currentTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // ==================== 1. IMAGE GENERATION (SDXL ACTIVE MODEL) ====================
    const imageKeywords = ['image banao', 'tasveer banao', 'photo banao', 'picture', 'draw', 'generate image', 'dikhaiye', 'portrait', 'banner', 'poster', 'cinematic prompt'];
    if (imageKeywords.some(kw => lowerMsg.includes(kw))) {
      if (!process.env.HF_TOKEN) {
        return res.status(200).json({ reply: '❌ Image banane ke liye Vercel me HF_TOKEN add karo.' });
      }
      try {
        const prompt = userMessage.replace(/image banao|tasveer banao|photo banao|picture|draw|generate image|dikhaiye|portrait|banner|poster|cinematic prompt/gi, '').trim();
        
        if (!prompt) {
          return res.status(200).json({ reply: '📸 Aap kis cheez ki image banana chahte hain? Please description bhi likhein (e.g., "image banao ek sher ki").' });
        }

        // Using StabilityAI SDXL Base 1.0 (Fixes 404 error)
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

        if (hfRes.status === 503) return res.status(200).json({ reply: `⏳ Image model load ho raha hai. 20 second baad "${prompt}" phir bhej.` });
        if (hfRes.status === 429) return res.status(200).json({ reply: `❌ Aaj ka free image quota khatam. Kal subah 5:30 AM ke baad try karo.` });
        if (hfRes.status === 404) return res.status(200).json({ reply: `❌ Error 404: Hugging Face par yeh model nahi mila. Code mein URL check karein.` });
        if (!hfRes.ok) return res.status(200).json({ reply: `❌ Image Error ${hfRes.status}. HF_TOKEN status check karo.` });

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
        
        if (!prompt) {
          return res.status(200).json({ reply: '🎬 Aap kis topic par video banana chahte hain? Description zaroor likhein.' });
        }

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
          
