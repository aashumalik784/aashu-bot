import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! मैं Aashu AI हूँ" }
  ]);
  const [typing, setTyping] = useState(false);

  // 🎤 Voice Input
  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };

    recognition.start();
  };

  // 🔊 Voice Output
  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    speechSynthesis.speak(utter);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;

    const newMessages = [
      ...messages,
      { role: "user", content: userMessage }
    ];

    setMessages(newMessages);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await res.json();

      setTyping(false);

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply }
      ]);

      speak(data.reply);

    } catch (err) {
      setTyping(false);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "❌ Error in AI response" }
      ]);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>🤖 Aashu AI (Gemini Style)</div>

      {/* CHAT BOX */}
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

        {/* ✨ TYPING INDICATOR */}
        {typing && (
          <div style={styles.typing}>
            Aashu AI is typing...
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div style={styles.inputBox}>
        
        <button onClick={startVoice} style={styles.mic}>
          🎤
        </button>

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
  chat: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%"
  },
  typing: {
    fontStyle: "italic",
    color: "gray"
  },
  inputBox: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #ddd",
    alignItems: "center"
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: "1px solid #ccc",
    marginLeft: 8
  },
  btn: {
    marginLeft: 10,
    padding: "10px 15px",
    borderRadius: 20,
    background: "black",
    color: "white",
    border: "none"
  },
  mic: {
    padding: "10px 12px",
    borderRadius: "50%",
    border: "none",
    background: "red",
    color: "white"
  }
};
