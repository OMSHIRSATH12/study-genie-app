"use client";

import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to UI immediately
    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response from API");
      }

      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[75%] ${
              msg.role === "user"
                ? "bg-blue-600 ml-auto text-right"
                : "bg-gray-700 mr-auto text-left"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div className="text-gray-400">Thinking...</div>}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-gray-900 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-600 outline-none"
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}