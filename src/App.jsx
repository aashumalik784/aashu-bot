import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! मैं Aashu AI हूँ" }
  ]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;

    setMessages((prev) => [...prev, { role: "user", content: userText }]);
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
    <div style={styles.container}>
      <div style={styles.header}>🤖 Aashu AI Bot</div>

      <div style={styles.chat}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#DCF8C6" : "#f1f1f1"
            }}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div style={styles.inputBox}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message likho..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.btn}>
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column" },
  header: { padding: 15, fontSize: 20, fontWeight: "bold", borderBottom: "1px solid #ddd" },
  chat: { flex: 1, padding: 10, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 },
  msg: { padding: 10, borderRadius: 10, maxWidth: "70%" },
  inputBox: { display: "flex", padding: 10, borderTop: "1px solid #ddd" },
  input: { flex: 1, padding: 10, borderRadius: 20, border: "1px solid #ccc" },
  btn: { marginLeft: 10, padding: "10px 15px", borderRadius: 20, background: "#000", color: "#fff" }
};
