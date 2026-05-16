const sendMessage = async () => {
  if (!input.trim()) return;

  const userMsg = { role: "user", content: input };
  setMessages((prev) => [...prev, userMsg]);

  const userText = input;
  setInput("");

  const res = await fetch("https://YOUR_BACKEND_URL/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userText })
  });

  const data = await res.json();

  setMessages((prev) => [
    ...prev,
    { role: "assistant", content: data.reply }
  ]);
};
