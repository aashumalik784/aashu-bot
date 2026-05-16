import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "🤖 Aashu Bot ready hai!" }
  ]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    const userText = input;
    setInput("");

    const res = await fetch("https://YOUR-BACKEND-URL/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText })
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply }
    ]);
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
