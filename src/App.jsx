import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! Main Aashu Bot hoon 🤖" }
  ]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = [...messages, { role: "user", content: input }];

    setMessages([
      ...newMsg,
      { role: "assistant", content: "AI response (abhi API connect nahi hai)" }
    ]);

    setInput("");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
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
        placeholder="Type something..."
        style={{ width: "80%", padding: 8, marginTop: 10 }}
      />

      <button onClick={sendMessage} style={{ padding: 8, marginLeft: 10 }}>
        Send
      </button>
    </div>
  );
}
