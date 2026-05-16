import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! मैं Aashu AI हूँ, तुम्हारी मदद के लिए ready हूँ।" }
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
      const res = await fetch("https://aashu-ai-bot.hf.space/run/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: [userText, "Chat AI 💬"]
        })
      });

      const data = await res.json();

      const reply =
        Array.isArray(data?.data)
          ? data.data[0]
          : data?.data || "🤖 No response";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply }
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
      
      {/* Header */}
      <div style={styles.header}>
        🤖 Aashu AI
      </div>

      {/* Chat Box */}
      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#DCF8C6" : "#f1f1f1"
            }}
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div style={styles.inputBox}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Aashu AI..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.button}>
          ➤
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial"
  },
  header: {
    padding: 15,
    fontSize: 20,
    fontWeight: "bold",
    borderBottom: "1px solid #ddd"
  },
  chatBox: {
    flex: 1,
    padding: 15,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#fafafa"
  },
  message: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    fontSize: 14
  },
  inputBox: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #ddd"
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: "1px solid #ccc",
    outline: "none"
  },
  button: {
    marginLeft: 10,
    padding: "10px 15px",
    borderRadius: 20,
    border: "none",
    background: "#000",
    color: "white",
    cursor: "pointer"
  }
};
