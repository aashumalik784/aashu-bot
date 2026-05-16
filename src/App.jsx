import { useState, useEffect } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState("");

  // 💾 LOAD MEMORY
  useEffect(() => {
    const savedChat = localStorage.getItem("chat");
    const savedName = localStorage.getItem("name");

    if (savedChat) setMessages(JSON.parse(savedChat));
    if (savedName) setUserName(savedName);
  }, []);

  // 💾 SAVE MEMORY
  useEffect(() => {
    localStorage.setItem("chat", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 🧠 detect name
    if (input.toLowerCase().includes("my name is")) {
      const name = input.split("is")[1]?.trim();
      setUserName(name);
      localStorage.setItem("name", name);
    }

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
        userProfile: {
          name: userName
        }
      })
    });

    const data = await res.json();

    setMessages([
      ...newMessages,
      { role: "assistant", content: data.reply }
    ]);
  };

  return (
    <div style={styles.container}>
      
      <div style={styles.header}>
        🤖 Aashu AI (Personality Engine)
      </div>

      {userName && (
        <div style={styles.welcome}>
          👋 Welcome back, {userName}
        </div>
      )}

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
          placeholder="Type message..."
        />
        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column" },
  header: { padding: 15, fontWeight: "bold", fontSize: 18 },
  welcome: { padding: 10, color: "green" },
  chat: { flex: 1, overflowY: "auto", padding: 10 },
  msg: { padding: 10, borderRadius: 10, maxWidth: "70%", marginBottom: 10 },
  inputBox: { display: "flex", padding: 10 }
};
