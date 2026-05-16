import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "🤖 Aashu Bot ready hai!" }
  ]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText }
    ]);

    setInput("");

    try {
      const res = await fetch(
        "https://aashu-ai-bot.hf.space/run/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            data: [userText, "Chat AI 💬"]
          })
        }
      );

      const data = await res.json();

      const reply = data?.data || "🤖 No response";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply }
      ]);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error: AI not responding" }
      ]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🤖 Aashu Bot</h2>

      <div style={{ height: 300, overflowY: "auto", border: "1px solid #ccc", padding: 10 }}>
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.role}:</b> {m.content}
          </p>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Message likho..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
