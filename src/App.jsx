import { useState, useEffect, useRef } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState("");
  const chatEndRef = useRef(null);

  // 💾 LOCAL STORAGE SE DATA LOAD KARNA
  useEffect(() => {
    const savedChat = localStorage.getItem("chat");
    const savedName = localStorage.getItem("name");

    if (savedChat) setMessages(JSON.parse(savedChat));
    if (savedName) setUserName(savedName);
  }, []);

  // 💾 MESSAGE AANE PAR AUTO-SCROLL AUR MEMORY SAVE
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chat", JSON.stringify(messages));
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    let currentName = userName;
    
    // 🧠 Name Detection Logic
    if (input.toLowerCase().includes("my name is")) {
      const name = input.split(/is/i)[1]?.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      if (name) {
        setUserName(name);
        currentName = name;
        localStorage.setItem("name", name);
      }
    }

    const newMessages = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userProfile: {
            name: currentName
          }
        })
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Failed to connect to backend server." }
      ]);
    }
  };

  // Keyboard Enter Key functionality
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      
      {/* HEADER SECTION */}
      <div style={styles.header}>
        <span style={{ color: "#E50914" }}>🤖</span> Aashu AI <span style={styles.engineTag}>Personality Engine</span>
      </div>

      {/* USER NAME WELCOME TAG */}
      {userName && (
        <div style={styles.welcome}>
          <span style={{ color: "#E50914" }}>●</span> Connected as: <strong>{userName}</strong>
        </div>
      )}

      {/* CHAT WINDOW */}
      <div style={styles.chat}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            Say "Hi" or tell your name to begin chat!
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#E50914" : "#1F293D",
              color: "#FFFFFF",
              borderRadius: m.role === "user" ? "15px 15px 0px 15px" : "15px 15px 15px 0px"
            }}
          >
            {m.content}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT CONTROLS */}
      <div style={styles.inputBox}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Aashu AI anything..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.button}>➤</button>
      </div>
    </div>
  );
}

// PREMIUM DARK HIGH CONTRAST THEME STYLES
const styles = {
  container: { 
    height: "100vh", 
    display: "flex", 
    flexDirection: "column", 
    background: "#0A0E1A", 
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#F5F5F7"
  },
  header: { 
    padding: "18px 20px", 
    fontWeight: "700", 
    fontSize: "20px", 
    background: "#111726", 
    borderBottom: "1px solid #1F293D",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  engineTag: {
    fontSize: "12px",
    background: "#1F293D",
    padding: "3px 8px",
    borderRadius: "4px",
    color: "#B3B3B3",
    fontWeight: "normal"
  },
  welcome: { 
    padding: "10px 20px", 
    background: "rgba(229, 9, 20, 0.1)", 
    color: "#FF4D4D",
    fontSize: "14px",
    borderBottom: "1px solid rgba(229, 9, 20, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  chat: { 
    flex: 1, 
    overflowY: "auto", 
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  emptyState: {
    color: "#566A8F",
    textAlign: "center",
    marginTop: "40px",
    fontSize: "15px"
  },
  msg: { 
    padding: "12px 16px", 
    maxWidth: "75%", 
    fontSize: "15px",
    lineHeight: "1.5",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    wordBreak: "break-word"
  },
  inputBox: { 
    display: "flex", 
    padding: "15px 20px", 
    background: "#111726",
    borderTop: "1px solid #1F293D",
    gap: "10px"
  },
  input: {
    flex: 1,
    background: "#1F293D",
    border: "1px solid #2C3A57",
    borderRadius: "8px",
    padding: "12px 15px",
    color: "#FFF",
    fontSize: "15px",
    outline: "none"
  },
  button: {
    background: "#E50914", 
    color: "#FFF",
    border: "none",
    borderRadius: "8px",
    padding: "0 20px",
    fontSize: "18px",
    cursor: "pointer"
  }
};
    
