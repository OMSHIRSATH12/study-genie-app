"use client";

import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResponse("Loading...");

    try {
      const res = await fetch("/api/askGemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();
      setResponse(data.output || "No response");
    } catch (err) {
      console.error(err);
      setResponse("Error occurred!");
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gemini Chat</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-black"
          placeholder="Ask something..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Ask
        </button>
      </form>
      <div className="mt-4 p-3 border rounded bg-gray-100 text-black">
        {response}
      </div>
    </div>
  );
}