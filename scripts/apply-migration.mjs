/**
 * Aplica migrations SQL pendentes no Supabase.
 *
 * Modos (qualquer um):
 *   SUPABASE_ACCESS_TOKEN — Management API (recomendado)
 *   SUPABASE_DB_PASSWORD ou DATABASE_URL — conexão PostgreSQL direta
 *
 * Uso: npm run supabase:migrate
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import pg from "pg";

const PROJECT_REF =
  process.env.SUPABASE_PROJECT_ID?.trim() || "tajtzkavjoafelhltugo";

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

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (!files.length) {
  console.log("ℹ️  Nenhuma migration encontrada.");
  process.exit(0);
}

async function fetchAppliedViaApi(token) {
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "select filename from _schema_migrations order by filename",
        }),
      },
    );
    if (!res.ok) return new Set();
    const rows = await res.json();
    if (!Array.isArray(rows)) return new Set();
    return new Set(rows.map((r) => r.filename));
  } catch {
    return new Set();
  }
}

async function ensureMigrationsTableApi(token) {
  await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          create table if not exists _schema_migrations (
            filename text primary key,
            applied_at timestamptz default now()
          )
        `,
      }),
    },
  );
}

async function runSqlApi(token, sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const body = await res.text();
  if (!res.ok) {
    let msg = body;
    try {
      const j = JSON.parse(body);
      msg = j.message || j.error || body;
    } catch {
      /* keep raw */
    }
    throw new Error(msg);
  }
}

async function migrateViaApi(token) {
  await ensureMigrationsTableApi(token);
  const done = await fetchAppliedViaApi(token);

  let count = 0;
  for (const file of files) {
    if (done.has(file)) {
      console.log("⏭️ ", file, "(já aplicada)");
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log("▶️ ", file);
    await runSqlApi(token, sql);
    await runSqlApi(
      token,
      `insert into _schema_migrations (filename) values ('${file.replace(/'/g, "''")}')`,
    );
    console.log("✅", file);
    count++;
  }

  if (!count) console.log("ℹ️  Todas as migrations já estavam aplicadas.");
  else console.log(`\n✅ ${count} migration(s) aplicada(s) via Management API.`);
}

async function migrateViaPg(dbUrl) {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(`
      create table if not exists _schema_migrations (
        filename text primary key,
        applied_at timestamptz default now()
      )
    `);

    const { rows: applied } = await client.query(
      "select filename from _schema_migrations order by filename",
    );
    const done = new Set(applied.map((r) => r.filename));

    let count = 0;
    for (const file of files) {
      if (done.has(file)) {
        console.log("⏭️ ", file, "(já aplicada)");
        continue;
      }
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      console.log("▶️ ", file);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into _schema_migrations (filename) values ($1)",
          [file],
        );
        await client.query("commit");
        console.log("✅", file);
        count++;
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }

    if (!count) console.log("ℹ️  Todas as migrations já estavam aplicadas.");
    else console.log(`\n✅ ${count} migration(s) aplicada(s) via PostgreSQL.`);
  } finally {
    await client.end();
  }
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const dbUrl =
  process.env.DATABASE_URL?.trim() ||
  (process.env.SUPABASE_DB_PASSWORD?.trim()
    ? `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD.trim())}@db.${PROJECT_REF}.supabase.co:5432/postgres`
    : "");

try {
  if (accessToken) {
    await migrateViaApi(accessToken);
  } else if (dbUrl) {
    await migrateViaPg(dbUrl);
  } else {
    console.error("❌ Credencial ausente para migrations.");
    console.error("");
    console.error("Opção A (recomendada) — em .env.local:");
    console.error("  SUPABASE_ACCESS_TOKEN=sbp_...");
    console.error("  (Supabase Dashboard → Account → Access Tokens)");
    console.error("");
    console.error("Opção B — em .env.local:");
    console.error("  SUPABASE_DB_PASSWORD=sua-senha");
    console.error("  (Supabase → Settings → Database → Database password)");
    process.exit(1);
  }
} catch (err) {
  console.error("❌", err.message);
  process.exit(1);
}
