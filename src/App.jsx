import { useState, useEffect } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const [typing, setTyping] = useState(false);

  // 💾 LOAD CHAT FROM STORAGE
  useEffect(() => {
    const saved = localStorage.getItem("chat");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // 💾 SAVE CHAT
  useEffect(() => {
    localStorage.setItem("chat", JSON.stringify(messages));
  }, [messages]);

  // 🎤 VOICE INPUT
  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return alert("Not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";

    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };

    recognition.start();
  };

  // 🔊 SPEAK
  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utter);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(newMessages);
    setInput("");
    setTyping(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages })
    });

    const data = await res.json();

    setTyping(false);

    if (data.type === "image") {
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply, image: true }
      ]);
    } else {
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply }
      ]);
      speak(data.reply);
    }
  };

  return (
    <div className="app">
      
      {/* HEADER */}
      <div className="header">🤖 Aashu AI PRO</div>

      {/* CHAT */}
      <div className="chat">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "user" : "bot"}
          >
            {m.image ? (
              <img src={m.content} width="200" />
            ) : (
              m.content
            )}
          </div>
        ))}

        {typing && <div className="typing">AI is typing...</div>}
      </div>

      {/* INPUT */}
      <div className="inputBox">
        <button onClick={startVoice}>🎤</button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
        />

        <button onClick={sendMessage}>➤</button>
      </div>

      {/* CSS */}
      <style>{`
        .app {
          height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: Arial;
        }
        .header {
          padding: 15px;
          font-size: 18px;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
        }
        .chat {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .user {
          align-self: flex-end;
          background: #DCF8C6;
          padding: 10px;
          border-radius: 10px;
          max-width: 70%;
        }
        .bot {
          align-self: flex-start;
          background: #f1f1f1;
          padding: 10px;
          border-radius: 10px;
          max-width: 70%;
        }
        .typing {
          font-style: italic;
          color: gray;
        }
        .inputBox {
          display: flex;
          padding: 10px;
          border-top: 1px solid #ddd;
        }
        input {
          flex: 1;
          padding: 10px;
          border-radius: 20px;
          border: 1px solid #ccc;
        }
        button {
          margin-left: 5px;
          padding: 10px;
          border-radius: 50%;
          border: none;
          background: black;
          color: white;
        }
      `}</style>
    </div>
  );
      }
