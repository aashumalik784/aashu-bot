import { useState, useEffect } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [lang, setLang] = useState("hi");

  // 💾 LOAD MEMORY
  useEffect(() => {
    const saved = localStorage.getItem("chat");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // 💾 SAVE MEMORY
  useEffect(() => {
    localStorage.setItem("chat", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(newMessages);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,
        language: lang
      })
    });

    const data = await res.json();

    if (data.type === "search") {
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply + " " + data.url }
      ]);
    } else {
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply }
      ]);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>🤖 Aashu AI PRO</div>

      {/* LANGUAGE SELECT */}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={styles.lang}
      >
        <option value="hi">Hindi</option>
        <option value="en">English</option>
        <option value="ur">Urdu</option>
      </select>

      {/* CHAT */}
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

      {/* INPUT */}
      <div style={styles.inputBox}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
        />

        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column" },
  header: { padding: 15, fontWeight: "bold", fontSize: 18 },
  lang: { margin: 10, padding: 5 },
  chat: { flex: 1, overflowY: "auto", padding: 10 },
  msg: { padding: 10, borderRadius: 10, maxWidth: "70%", marginBottom: 10 },
  inputBox: { display: "flex", padding: 10 },
};
