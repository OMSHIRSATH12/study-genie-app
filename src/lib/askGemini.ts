// src/lib/askGemini.ts
export async function askGemini(prompt: string) {
  const res = await fetch("/api/askGemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Request failed with ${res.status}`);
  }

  return res.json();
}