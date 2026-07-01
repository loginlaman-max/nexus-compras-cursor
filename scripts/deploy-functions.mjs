/**
 * Deploy das Edge Functions no Supabase.
 * Requer SUPABASE_ACCESS_TOKEN em .env.local ou ambiente.
 *
 * Uso: npm run supabase:deploy-functions
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_REF =
  process.env.SUPABASE_PROJECT_ID?.trim() || "tajtzkavjoafelhltugo";

const FUNCTIONS = ["parse-nfe", "parse-cte", "calc-custo-real", "bling-sync"];

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (val) process.env[key] = val;
  }
}

loadEnvLocal();

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) {
  console.error("❌ Defina SUPABASE_ACCESS_TOKEN em .env.local");
  console.error("   Supabase Dashboard → Account → Access Tokens → Generate new token");
  process.exit(1);
}

let failed = false;
for (const name of FUNCTIONS) {
  console.log(`\n🚀 Deploy: ${name}`);
  const result = spawnSync(
    "npx",
    [
      "supabase",
      "functions",
      "deploy",
      name,
      "--project-ref",
      PROJECT_REF,
    ],
    {
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
      stdio: "inherit",
      shell: true,
    },
  );
  if (result.status !== 0) {
    console.error(`❌ Falha no deploy de ${name}`);
    failed = true;
  } else {
    console.log(`✅ ${name} deployada`);
  }
}

if (failed) process.exit(1);
console.log("\n✅ Todas as edge functions deployadas.");
