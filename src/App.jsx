import { useState, useEffect, useRef } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState({}); 
  const [activeChatId, setActiveChatId] = useState(""); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachedImage, setAttachedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null); 
  const chatEndRef = useRef(null);
  const menuRef = useRef(null);

  const profileImgPath = "/AASHU_MALIK.jpg";

  // 1. Initial State Load (Strict Separation for Multiple Chat Boxes)
  useEffect(() => {
    const savedChats = localStorage.getItem("aashu_ai_multichats");
    const savedActiveId = localStorage.getItem("aashu_ai_active_multichat_id");
    
    if (savedChats && savedChats !== "{}") {
      const parsed = JSON.parse(savedChats);
      setConversations(parsed);
      if (savedActiveId && parsed[savedActiveId]) {
        setActiveChatId(savedActiveId);
      } else {
        setActiveChatId(Object.keys(parsed)[0]);
      }
    } else {
      setupFirstFreshChat();
    }
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  // 2. Continuous Scroll to Bottom Anchor
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeChatId, loading]);

  // Click Outside to close the 3-dot popup menu panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setupFirstFreshChat = () => {
    const defaultId = "box_" + Date.now();
    const firstChat = {
      [defaultId]: { id: defaultId, title: "New Chat Box", history: [] }
    };
    setConversations(firstChat);
    setActiveChatId(defaultId);
    localStorage.setItem("aashu_ai_multichats", JSON.stringify(firstChat));
    localStorage.setItem("aashu_ai_active_multichat_id", defaultId);
  };

  // ➕ CREATE UNLIMITED NEW SEPARATE CHAT BOXES
  const createNewChatBox = () => {
    const newBoxId = "box_" + Date.now();
    const totalBoxes = Object.keys(conversations).length + 1;
    
    const updatedConversations = {
      [newBoxId]: { id: newBoxId, title: `Chat Session ${totalBoxes}`, history: [] },
      ...conversations
    };
    
    setConversations(updatedConversations);
    setActiveChatId(newBoxId);
    localStorage.setItem("aashu_ai_multichats", JSON.stringify(updatedConversations));
    localStorage.setItem("aashu_ai_active_multichat_id", newBoxId);
    
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // 🗑️ DELETE INDEPENDENT CHAT BOX WITHOUT AFFECTING OTHERS
  const deleteSpecificBox = (id) => {
    const updated = { ...conversations };
    delete updated[id];
    setOpenMenuId(null);
    
    if (Object.keys(updated).length === 0) {
      localStorage.removeItem("aashu_ai_multichats");
      localStorage.removeItem("aashu_ai_active_multichat_id");
      setupFirstFreshChat();
      return;
    }

    setConversations(updated);
    localStorage.setItem("aashu_ai_multichats", JSON.stringify(updated));
    
    if (id === activeChatId) {
      const remainingIds = Object.keys(updated);
      setActiveChatId(remainingIds[0]);
      localStorage.setItem("aashu_ai_active_multichat_id", remainingIds[0]);
    }
  };

  const copyBoxHistoryData = (chat) => {
    setOpenMenuId(null);
    if (!chat.history || chat.history.length === 0) {
       alert("Is chat box mein filhal koi message history record nahi hai! ❌");
       return;
    }
    const compiledLogs = chat.history
      .map(m => `${m.role === "user" ? "You" : "Aashu AI"}: ${m.content}`)
      .join("\n\n");
    
    navigator.clipboard.writeText(compiledLogs).then(() => {
      alert("Is chat box ki history clipboard par copy ho gayi! ✅");
    });
  };

  const switchChatBox = (id) => {
    setActiveChatId(id);
    localStorage.setItem("aashu_ai_active_multichat_id", id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const toggleThreeDotMenu = (id, e) => {
    e.stopPropagation(); 
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 🚀 SEND MESSAGE PACKET LOCKED TO ACTIVE CHAT BOX ONLY
  const sendTargetedMessage = async () => {
    if (!input.trim() && !attachedImage) return;
    if (!activeChatId) return;

    setLoading(true);
    const userMsgPacket = { role: "user", content: input, image: attachedImage || null };
    
    const targetChat = conversations[activeChatId] || { history: [], title: "Chat Box" };
    const currentHistoryState = [...targetChat.history, userMsgPacket];
    
    // Auto Update title on first message injection
    let dynamicTitle = targetChat.title;
    if (targetChat.history.length === 0 && input.trim()) {
      dynamicTitle = input.substring(0, 18) + "...";
    }

    const stageConversations = {
      ...conversations,
      [activeChatId]: { ...targetChat, title: dynamicTitle, history: currentHistoryState }
    };

    setConversations(stageConversations);
    localStorage.setItem("aashu_ai_multichats", JSON.stringify(stageConversations));
    
    setInput("");
    setAttachedImage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentHistoryState })
      });

      const data = await res.json();
      
      const completeConversations = {
        ...stageConversations,
        [activeChatId]: {
          ...stageConversations[activeChatId],
          history: [...currentHistoryState, { role: "assistant", content: data.reply }]
        }
      };
      
      setConversations(completeConversations);
      localStorage.setItem("aashu_ai_multichats", JSON.stringify(completeConversations));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return "";
    let formatted = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #a8c7fa; text-decoration: underline; font-weight: 600;">$1</a>');
    const urlRegex = /(?<!href=")(https?:\/\/[^\s<]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #a8c7fa; text-decoration: underline; font-weight: 600;">$1</a>');

    if (formatted.includes("```")) {
      const segments = formatted.split("```");
      return segments.map((seg, idx) => {
        if (idx % 2 !== 0) {
          return <pre key={idx} style={styles.codeBlock}><code>{seg.replace(/^[a-zA-Z]+/, "").trim()}</code></pre>;
        }
        return <span key={idx} dangerouslySetInnerHTML={{ __html: seg }} />;
      });
    }
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const activeMessagesArray = conversations[activeChatId]?.history || [];

  return (
    <div style={styles.appContainer}>
      {/* 📊 SIDEBAR PANEL: UNLIMITED SEPARATE HISTORIES VIEW */}
      <div style={{...styles.sidebar, width: isSidebarOpen ? "280px" : "0px", opacity: isSidebarOpen ? 1 : 0}}>
        <div style={styles.sidebarHeader}>
          <button onClick={createNewChatBox} style={styles.newChatBtn}>＋ New Chat</button>
        </div>
        <div style={styles.sidebarBody}>
          <div style={styles.historyHeading}>Recent Activity</div>
          <div style={styles.historyList}>
            {Object.values(conversations).map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => switchChatBox(chat.id)}
                style={{
                  ...styles.historyItem, 
                  background: chat.id === activeChatId ? "#2c2d2f" : "transparent"
                }}
              >
                <div style={styles.itemLeft}>
                  <span style={styles.chatIcon}>💬</span>
                  <span style={styles.chatTitleText}>{chat.title}</span>
                </div>
                
                {/* THREE DOTS TRIGGER CONTROL */}
                <div style={{ position: "relative" }}>
                  <button onClick={(e) => toggleThreeDotMenu(chat.id, e)} style={styles.threeDotBtn}>⋮</button>
                  
                  {/* POPUP CONTROL OPTIONS */}
                  {openMenuId === chat.id && (
                    <div ref={menuRef} style={styles.popupMenu}>
                      <div style={styles.menuOption} onClick={() => { setActiveChatId(chat.id); setOpenMenuId(null); }}>👁️ Show History</div>
                      <div style={styles.menuOption} onClick={() => copyBoxHistoryData(chat)}>📋 Copy History</div>
                      <div style={{...styles.menuOption, color: "#f28b82"}} onClick={() => deleteSpecificBox(chat.id)}>🗑️ Delete Chat</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.sidebarFooter}>User: Aashu Malik</div>
      </div>

      {/* 📱 CONSOLE VIEW AREA */}
      <div style={styles.mainContent}>
        <div style={styles.navbar}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.menuBtn}>☰</button>
          <div style={styles.navBrand}>Aashu AI Super Console</div>
          <div style={styles.avatarWrapper}>
            <img src={profileImgPath} alt="Aashu Malik Profile Asset" style={styles.avatarImage} onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} />
          </div>
        </div>

        <div style={styles.chatWindow}>
          {activeMessagesArray.length === 0 ? (
            <div style={styles.welcomeContainer}>
              <h1 style={styles.welcomeText}>Hello, Aashu</h1>
              <p style={styles.subWelcomeText}>This is a brand new separate chat box interface.</p>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {activeMessagesArray.map((m, i) => (
                <div key={i} style={m.role === "user" ? styles.userRow : styles.aiRow}>
                  <div style={m.role === "user" ? styles.userAvatarContainer : styles.aiAvatar}>
                    {m.role === "user" ? <img src={profileImgPath} style={styles.chatUserImg} alt="M" /> : "✨"}
                  </div>
                  <div style={styles.messageContent}>
                    <div style={styles.senderName}>{m.role === "user" ? "You" : "Aashu AI"}</div>
                    <div style={styles.textBody}>{renderFormattedText(m.content)}</div>
                    {m.image && (
                      <div style={styles.chatImageWrapper}>
                        <img src={m.image} alt="Workspace Image Layout Data" style={styles.chatEmbeddedImage} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={styles.aiRow}>
                  <div style={styles.aiAvatar}>🔄</div>
                  <div style={styles.messageContent}>
                    <div style={styles.senderName}>Aashu AI</div>
                    <div style={styles.loadingText}>Thinking... Processing layout nodes...</div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div style={styles.inputContainer}>
          {attachedImage && (
            <div style={styles.previewContainer}>
              <img src={attachedImage} style={styles.previewThumb} alt="P" />
              <button onClick={() => setAttachedImage(null)} style={styles.removePreviewBtn}>✕</button>
            </div>
          )}
          <div style={styles.inputWrapper}>
            <label htmlFor="screenshot-input" style={styles.clipLabel}>📎</label>
            <input id="screenshot-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTargetedMessage(); } }}
              placeholder="Type message or paste url..." 
              rows={1}
              style={styles.input} 
            />
            <button onClick={sendTargetedMessage} style={styles.sendBtn}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: { display: "flex", height: "100vh", background: "#131314", color: "#e3e3e3", fontFamily: "sans-serif", overflow: "hidden" },
  sidebar: { background: "#1e1f20", display: "flex", flexDirection: "column", transition: "all 0.25s ease-in-out", overflow: "hidden", borderRight: "1px solid #28292a", zIndex: 10 },
  sidebarHeader: { padding: "16px" },
  newChatBtn: { width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #3c4043", color: "#a8c7fa", borderRadius: "24px", cursor: "pointer", fontWeight: "600" },
  sidebarBody: { flex: 1, padding: "10px", overflowY: "auto" },
  historyHeading: { fontSize: "12px", color: "#9aa0a6", paddingLeft: "10px", marginBottom: "10px", fontWeight: "600" },
  historyList: { display: "flex", flexDirection: "column", gap: "6px" },
  historyItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "20px", cursor: "pointer", color: "#e3e3e3" },
  itemLeft: { display: "flex", alignItems: "center", overflow: "hidden", flex: 1 },
  chatIcon: { marginRight: "8px" },
  chatTitleText: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "14px" },
  threeDotBtn: { background: "none", border: "none", color: "#9aa0a6", cursor: "pointer", fontSize: "18px", padding: "0 4px", fontWeight: "bold" },
  popupMenu: { position: "absolute", right: "0", top: "24px", background: "#282a2c", borderRadius: "8px", border: "1px solid #3c4043", padding: "6px 0", width: "150px", boxShadow: "0px 4px 12px rgba(0,0,0,0.5)", zIndex: 100 },
  menuOption: { padding: "10px 14px", fontSize: "13px", color: "#e3e3e3", cursor: "pointer", transition: "background 0.2s" },
  sidebarFooter: { padding: "16px", fontSize: "13px", color: "#9aa0a6", borderTop: "1px solid #28292a", textAlign: "center" },
  mainContent: { flex: 1, display: "flex", flexDirection: "column", minWidth: "0" },
  navbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px" },
  menuBtn: { background: "none", border: "none", color: "#e3e3e3", fontSize: "22px", cursor: "pointer" },
  navBrand: { fontSize: "18px", fontWeight: "500" },
  avatarWrapper: { width: "34px", height: "34px", borderRadius: "50%", overflow: "hidden", border: "1px solid #3c4043" },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover" },
  chatWindow: { flex: 1, overflowY: "auto" },
  welcomeContainer: { maxWidth: "600px", margin: "100px auto 0", padding: "0 20px", textAlign: "center" },
  welcomeText: { fontSize: "36px", background: "linear-gradient(45deg, #a8c7fa, #ccbcfb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subWelcomeText: { fontSize: "16px", color: "#80868b", marginTop: "10px" },
  messagesList: { maxWidth: "700px", margin: "0 auto", padding: "20px" },
  userRow: { display: "flex", flexDirection: "row-reverse", gap: "12px", marginBottom: "24px" },
  aiRow: { display: "flex", gap: "12px", marginBottom: "24px" },
  userAvatarContainer: { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 },
  chatUserImg: { width: "100%", height: "100%", objectFit: "cover" },
  aiAvatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#3c4043", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "14px" },
  messageContent: { flex: 1, minWidth: "0" },
  senderName: { fontSize: "12px", color: "#9aa0a6", marginBottom: "4px", fontWeight: "600" },
  textBody: { fontSize: "15px", lineHeight: "1.6", whiteSpace: "pre-wrap", color: "#e3e3e3" },
  codeBlock: { background: "#1e1f20", padding: "14px", borderRadius: "8px", overflowX: "auto", fontFamily: "monospace", color: "#f8f8f2", marginTop: "10px" },
  loadingText: { fontSize: "14px", color: "#9aa0a6", fontStyle: "italic" },
  chatImageWrapper: { marginTop: "10px", borderRadius: "8px", overflow: "hidden" },
  chatEmbeddedImage: { maxWidth: "100%", maxHeight: "250px", objectFit: "contain" },
  inputContainer: { maxWidth: "700px", width: "100%", margin: "0 auto", padding: "0 16px 16px", boxSizing: "border-box" },
  previewContainer: { display: "flex", alignItems: "center", background: "#1e1f20", padding: "6px", borderRadius: "8px", width: "fit-content", marginBottom: "8px" },
  previewThumb: { width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" },
  removePreviewBtn: { background: "none", border: "none", color: "#9aa0a6", cursor: "pointer", marginLeft: "6px" },
  inputWrapper: { display: "flex", alignItems: "center", background: "#1e1f20", borderRadius: "24px", padding: "8px 16px" },
  clipLabel: { fontSize: "20px", cursor: "pointer", marginRight: "12px", color: "#9aa0a6" },
  input: { flex: 1, background: "transparent", border: "none", color: "#e3e3e3", fontSize: "16px", outline: "none", resize: "none", fontFamily: "inherit", lineHeight: "20px", maxHeight: "100px" },
  sendBtn: { background: "none", border: "none", color: "#a8c7fa", fontSize: "20px", cursor: "pointer", marginLeft: "8px" }
};
    
