// src/hooks/useGemini.ts
"use client";

import { useState } from "react";
import { askGemini } from "@/lib/askGemini";

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [data, setData]     = useState<any>(null);

  const query = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await askGemini(prompt);
      setData(res);
      return res;
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { query, loading, error, data };
}