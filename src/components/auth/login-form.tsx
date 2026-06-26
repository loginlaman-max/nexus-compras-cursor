"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ROUTES } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let supabase;
      try {
        supabase = createClient();
      } catch {
        setError(
          "Supabase não configurado neste deploy. Cadastre NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel e faça Redeploy.",
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "E-mail ou senha inválidos."
            : signInError.message === "Email not confirmed"
              ? "Confirme seu e-mail no Supabase (Authentication → Users → Confirm user)."
              : signInError.message,
        );
        return;
      }

      router.push(redirectTo || AUTH_ROUTES.orgSelect);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao entrar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="type-caption font-medium text-foreground">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="type-caption font-medium text-foreground">
          Senha
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="rounded-md border border-status-ruptura/30 bg-status-ruptura/10 px-3 py-2 text-xs text-status-ruptura">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
