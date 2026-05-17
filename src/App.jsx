import { useState, useEffect, useRef } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  const profileImgPath = "/AASHU_MALIK.jpg";

  // 💾 MEMORY LOAD
  useEffect(() => {
    const savedChat = localStorage.getItem("chat");
    const savedName = localStorage.getItem("name");
    if (savedChat) setMessages(JSON.parse(savedChat));
    if (savedName) setUserName(savedName);
    
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  // 💾 AUTO-SCROLL
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chat", JSON.stringify(messages));
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🎙️ VOICE RECOGNITION (MIC FEATURE)
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Aapka browser voice recognition support nahi karta. Chrome use karein.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Set to Hindi/Hinglish interpretation
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
    };

    recognition.start();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✉️ SEND LOGIC
  const sendMessage = async () => {
    if (!input.trim() && !attachedImage) return;

    let currentName = userName;
    if (input.toLowerCase().includes("my name is")) {
      const name = input.split(/is/i)[1]?.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      if (name) {
        setUserName(name);
        currentName = name;
        localStorage.setItem("name", name);
      }
    }

    const userMessage = { role: "user", content: input, image: attachedImage || null };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setAttachedImage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          userProfile: { name: currentName }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.reply || `HTTP ${res.status}`);
      
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages([
        ...updatedMessages, 
        { role: "assistant", content: `⚠️ Connection Error Details: ${error.message}` }
      ]);
    }
  };

  const clearChat = () => {
    if (window.confirm("Kya aap poori chat clear karna chahte hain?")) {
      localStorage.removeItem("chat");
      setMessages([]);
    }
  };

  return (
    <div style={styles.appContainer}>
      
      {/* SIDEBAR */}
      <div style={{...styles.sidebar, width: isSidebarOpen ? "260px" : "0px", opacity: isSidebarOpen ? 1 : 0}}>
        <div style={styles.sidebarHeader}>
          <button onClick={clearChat} style={styles.newChatBtn}>＋ New Chat</button>
        </div>
        <div style={styles.sidebarBody}>
          <div style={styles.historyHeading}>Recent Activity</div>
          {messages.length > 0 && (
            <div style={styles.historyItem}>💬 Current Discussion</div>
          )}
        </div>
        <div style={styles.sidebarFooter}>
          User: {userName || "Aashu Malik"}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainContent}>
        
        {/* NAVBAR */}
        <div style={styles.navbar}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.menuBtn}>☰</button>
          <div style={styles.navBrand}>Aashu AI Super</div>
          <div style={styles.avatarWrapper}>
            <img src={profileImgPath} alt="Aashu Malik" style={styles.avatarImage} onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} />
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div style={styles.chatWindow}>
          {messages.length === 0 ? (
            <div style={styles.welcomeContainer}>
              <h1 style={styles.welcomeText}>Hello, {userName || "Aashu"}</h1>
              <p style={styles.subWelcomeText}>How can I help you collaborate today?</p>
              
              <div style={styles.suggestionGrid}>
                <div onClick={() => setInput("Write a clean python backend function")} style={styles.suggestCard}>💡 Code Design</div>
                <div onClick={() => setInput("Give me some viral ideas for my YouTube video")} style={styles.suggestCard}>🚀 Content Ideas</div>
              </div>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {messages.map((m, i) => (
                <div key={i} style={m.role === "user" ? styles.userRow : styles.aiRow}>
                  <div style={m.role === "user" ? styles.userAvatarContainer : styles.aiAvatar}>
                    {m.role === "user" ? (
                      <img src={profileImgPath} alt="User" style={styles.chatUserImg} onError={(e) => { e.target.style.display='none'; }} />
                    ) : (
                      "✨"
                    )}
                  </div>
                  <div style={styles.messageContent}>
                    <div style={styles.senderName}>{m.role === "user" ? "You" : "Aashu AI"}</div>
                    <div style={styles.textBody}>
                      {m.content}
                      {m.image && (
                        <div style={styles.chatImageWrapper}>
                          <img src={m.image} alt="Uploaded Screenshot" style={styles.chatEmbeddedImage} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* INPUT CONTROLS */}
        <div style={styles.inputContainer}>
          {attachedImage && (
            <div style={styles.previewContainer}>
              <img src={attachedImage} alt="Attachment Preview" style={styles.previewThumb} />
              <button onClick={() => setAttachedImage(null)} style={styles.removePreviewBtn}>✕</button>
            </div>
          )}
          
          <div style={styles.inputWrapper}>
            <label htmlFor="screenshot-upload" style={styles.clipLabel}>📎</label>
            <input id="screenshot-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask Aashu AI or talk to microphone..."
              style={styles.input}
            />
            
            {/* 🎙️ DYNAMIC MIC BUTTON */}
            <button 
              onClick={startVoiceInput} 
              style={{...styles.micBtn, color: isListening ? "#ea4335" : "#9aa0a6"}}
            >
              {isListening ? "🛑" : "🎙️"}
            </button>

            <button onClick={sendMessage} style={styles.sendBtn}>➤</button>
          </div>
          <div style={styles.footerDisclaimer}>
            Aashu AI Super Engine: Multimodal Voice, Vision and Reasoning Suite active.
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  appContainer: { display: "flex", height: "100vh", background: "#131314", color: "#e3e3e3", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" },
  sidebar: { background: "#1e1f20", display: "flex", flexDirection: "column", transition: "all 0.3s ease", overflow: "hidden", borderRight: "1px solid #28292a" },
  sidebarHeader: { padding: "20px 15px" },
  newChatBtn: { width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #3c4043", color: "#a8c7fa", borderRadius: "24px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  sidebarBody: { flex: 1, padding: "10px 15px" },
  historyHeading: { fontSize: "12px", color: "#9aa0a6", fontWeight: "600", marginBottom: "15px", paddingLeft: "10px" },
  historyItem: { padding: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", fontSize: "14px", color: "#c4c7c5", cursor: "pointer" },
  sidebarFooter: { padding: "20px", fontSize: "13px", color: "#9aa0a6", borderTop: "1px solid #28292a", textAlign: "center" },
  mainContent: { flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative" },
  navbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "#131314" },
  menuBtn: { background: "none", border: "none", color: "#e3e3e3", fontSize: "20px", cursor: "pointer" },
  navBrand: { fontSize: "18px", fontWeight: "500", color: "#c4c7c5" },
  avatarWrapper: { width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", border: "2px solid #3c4043", background: "#28292a" },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover" },
  chatWindow: { flex: 1, overflowY: "auto", padding: "10px 0" },
  welcomeContainer: { maxWidth: "700px", margin: "80px auto 0", padding: "0 20px" },
  welcomeText: { fontSize: "40px", fontWeight: "500", background: "linear-gradient(45deg, #4285f4, #9b51e0, #e91e63)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 10px 0" },
  subWelcomeText: { fontSize: "22px", color: "#444746", margin: "0 0 40px 0", fontWeight: "500" },
  suggestionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" },
  suggestCard: { background: "#1e1f20", padding: "20px", borderRadius: "12px", cursor: "pointer", border: "1px solid transparent", transition: "all 0.2s", fontSize: "14px", lineHeight: "1.4" },
  messagesList: { maxWidth: "750px", margin: "0 auto", padding: "20px" },
  userRow: { display: "flex", flexDirection: "row-reverse", gap: "15px", marginBottom: "30px", alignItems: "flex-start" },
  aiRow: { display: "flex", gap: "15px", marginBottom: "30px", alignItems: "flex-start" },
  userAvatarContainer: { width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", background: "#28292a" },
  chatUserImg: { width: "100%", height: "100%", objectFit: "cover" },
  aiAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #1a73e8, #9b51e0)", display: "flex", alignItems: "center", justifyContent: "center" },
  messageContent: { flex: 1 },
  senderName: { fontSize: "13px", color: "#9aa0a6", marginBottom: "4px", fontWeight: "600" },
  textBody: { fontSize: "15px", color: "#e3e3e3", lineHeight: "1.6", whiteSpace: "pre-wrap" },
  chatImageWrapper: { marginTop: "10px", borderRadius: "8px", overflow: "hidden", maxWidth: "300px", border: "1px solid #3c4043" },
  chatEmbeddedImage: { width: "100%", height: "auto", display: "block" },
  inputContainer: { maxWidth: "750px", width: "100%", margin: "0 auto", padding: "0 20px 20px 20px" },
  previewContainer: { display: "flex", alignItems: "center", background: "#1e1f20", padding: "8px", borderRadius: "8px", width: "fit-content", marginBottom: "10px", gap: "8px", border: "1px solid #3c4043" },
  previewThumb: { width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" },
  removePreviewBtn: { background: "none", border: "none", color: "#9aa0a6", cursor: "pointer", fontSize: "14px" },
  inputWrapper: { display: "flex", alignItems: "center", background: "#1e1f20", borderRadius: "32px", padding: "8px 16px 8px 16px", border: "1px solid transparent" },
  clipLabel: { fontSize: "20px", cursor: "pointer", marginRight: "12px", color: "#9aa0a6", userSelect: "none" },
  input: { flex: 1, background: "transparent", border: "none", color: "#e3e3e3", fontSize: "16px", outline: "none", padding: "10px 0" },
  micBtn: { background: "none", border: "none", fontSize: "20px", cursor: "pointer", padding: "0 8px", transition: "all 0.2s" },
  sendBtn: { background: "none", border: "none", color: "#a8c7fa", fontSize: "20px", cursor: "pointer", padding: "0 8px" },
};
                   
