import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! मैं Aashu AI हूँ" }
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply }
      ]);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ AI not responding" }
      ]);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial" }}>
      
      <div style={{ padding: 15, fontSize: 20, fontWeight: "bold", borderBottom: "1px solid #ddd" }}>
        🤖 Aashu AI Bot
      </div>

      <div style={{ flex: 1, padding: 10, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#DCF8C6" : "#f1f1f1",
              padding: 10,
              borderRadius: 10,
              maxWidth: "70%"
            }}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", padding: 10, borderTop: "1px solid #ddd" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message likho..."
          style={{ flex: 1, padding: 10, borderRadius: 20, border: "1px solid #ccc" }}
        />
        <button
          onClick={sendMessage}
          style={{ marginLeft: 10, padding: "10px 15px", borderRadius: 20, background: "black", color: "white" }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
