import { AlertTriangle, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

export default function SetupPage() {
  if (isSupabaseConfigured()) {
    redirect("/login");
  }

  return (
    <div className="nx-auth">
      <div className="nx-auth-inner">
        <Card className="nx-auth-card w-full max-w-[520px]">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-status-baixo">
              <AlertTriangle className="size-5 shrink-0" />
              <CardTitle className="text-base">Conectar Supabase</CardTitle>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              Projeto: <strong>NEXUS COMPRAS - VERCEL</strong>. Preencha{" "}
              <code className="mono rounded bg-surface-1 px-1 text-[11px]">.env.local</code>{" "}
              e reinicie <code className="mono text-[11px]">npm run dev</code>.
              Ou explore o app com dados mock abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-[12px] leading-relaxed">
            <a
              href="/dashboard"
              className="btn btn-primary flex w-full items-center justify-center gap-2"
            >
              Abrir modo demonstração
            </a>
            <ol className="list-decimal space-y-2 pl-4 text-foreground">
              <li>
                Abra{" "}
                <strong>NEXUS COMPRAS - VERCEL</strong> em{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  supabase.com/dashboard
                  <ExternalLink className="size-3" />
                </a>
              </li>
              <li>
                Em <strong>Settings → API</strong>, copie{" "}
                <span className="mono">Project URL</span> e{" "}
                <span className="mono">anon public</span> key
              </li>
              <li>
                Crie o arquivo{" "}
                <code className="mono rounded bg-surface-1 px-1 py-0.5 text-[11px]">
                  nexus-compras/.env.local
                </code>{" "}
                com:
              </li>
            </ol>

            <pre className="overflow-x-auto rounded-md border border-border bg-surface-1 p-3 font-mono text-[11px] leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui`}
            </pre>

            <p className="text-muted-foreground">
              Rode <code className="mono text-[11px]">supabase/schema.sql</code> no
              SQL Editor, teste com{" "}
              <code className="mono text-[11px]">npm run supabase:check</code> e
              acesse <code className="mono text-[11px]">/login</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
