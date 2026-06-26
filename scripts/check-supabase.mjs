/**
 * Testa conexão com o projeto Supabase em .env.local
 * Uso: npm run supabase:check
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.error("❌ .env.local incompleto.");
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase.from("organizacoes").select("id").limit(1);

if (error) {
  const msg = error.message.toLowerCase();
  if (msg.includes("does not exist") || msg.includes("schema cache")) {
    console.error("❌ Conectou ao Supabase, mas as tabelas ainda não existem.");
    console.error("   Rode supabase/schema.sql (ou _handoff/SUPABASE-SCHEMA.sql) no SQL Editor.");
  } else {
    console.error("❌", error.message);
  }
  process.exit(1);
}

console.log("✅ Supabase OK:", url);
console.log("   organizacoes:", data?.length ?? 0, "registro(s)");
