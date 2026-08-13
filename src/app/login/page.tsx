"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <div className="axis-bg" />
      <form
        onSubmit={handleSubmit}
        className="glass w-full max-w-sm rounded-3xl p-7 shadow-xl"
      >
        <div className="mb-7 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_8px_24px_-6px_rgba(37, 99, 235,0.6)]">
            <Zap size={22} className="text-white" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold glow-text">Axis</div>
            <div className="text-xs uppercase tracking-widest text-[#101a2e]/40">
              LS Brainstorm
            </div>
          </div>
        </div>

        <label className="mb-1 block text-xs font-medium text-[#101a2e]/60">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-sm text-[#101a2e] outline-none focus:border-blue-400"
        />

        <label className="mb-1 block text-xs font-medium text-[#101a2e]/60">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-5 w-full rounded-xl border border-[#101a2e]/10 bg-white/70 px-3.5 py-2.5 text-sm text-[#101a2e] outline-none focus:border-blue-400"
        />

        {error && <p className="mb-3 text-xs font-medium text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(37, 99, 235,0.6)] transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
