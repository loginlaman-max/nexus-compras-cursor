/**
 * Infra completa: migrations + edge functions.
 * Uso: npm run supabase:deploy-infra
 */
import { spawnSync } from "node:child_process";

function run(label, script) {
  console.log(`\n${"=".repeat(50)}\n${label}\n${"=".repeat(50)}`);
  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("1/2 — Migrations", "supabase:migrate");
run("2/2 — Edge Functions", "supabase:deploy-functions");
console.log("\n🎉 Infra Supabase concluída.");
