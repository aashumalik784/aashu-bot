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
    const has
