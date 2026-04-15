"use client";

import { useState } from "react";
import { authApi } from "@/core/api/auth";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.register({ username, email, password });

      localStorage.setItem("token", res.access_token);

      window.location.href = "/";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <input
        className="w-full p-2 border rounded"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        className="w-full p-2 border rounded"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full p-2 border rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        disabled={loading}
        className="w-full bg-black text-white p-2 rounded"
      >
        {loading ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
