/**
 * Vincula login.laman@gmail.com como owner (super admin) da org principal.
 * Uso: npm run supabase:seed-admin
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || "login.laman@gmail.com";
const ORG_NOME = process.env.ORG_NOME?.trim() || "Nexus Compras Distribuição LTDA";
const ORG_CNPJ = process.env.ORG_CNPJ?.trim() || "12.345.678/0001-90";

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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Verifica se schema existe
const { error: schemaErr } = await supabase.from("organizacoes").select("id").limit(1);
if (schemaErr?.message?.includes("schema cache") || schemaErr?.code === "PGRST205") {
  console.error("❌ Tabelas não existem. Rode supabase/schema.sql no SQL Editor primeiro.");
  process.exit(1);
}

// Org existente ou nova
let orgId;
const { data: existingOrgs } = await supabase
  .from("organizacoes")
  .select("id, nome")
  .eq("nome", ORG_NOME)
  .limit(1);

if (existingOrgs?.length) {
  orgId = existingOrgs[0].id;
  console.log("ℹ️  Organização já existe:", orgId);
} else {
  const { data: newOrg, error: orgErr } = await supabase
    .from("organizacoes")
    .insert({ nome: ORG_NOME, cnpj: ORG_CNPJ })
    .select("id")
    .single();

  if (orgErr) {
    console.error("❌ Erro ao criar organização:", orgErr.message);
    process.exit(1);
  }
  orgId = newOrg.id;
  console.log("✅ Organização criada:", orgId);
}

// Localiza usuário pelo e-mail
let adminUserId = null;
const { data: listed, error: listErr } = await supabase.auth.admin.listUsers({
  perPage: 1000,
});
if (listErr) {
  console.error("❌ Erro ao listar usuários:", listErr.message);
  process.exit(1);
}
const adminUser = listed?.users?.find(
  (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
);
if (!adminUser) {
  console.error(
    `❌ Usuário ${ADMIN_EMAIL} não encontrado. Crie a conta em /login primeiro.`,
  );
  process.exit(1);
}
adminUserId = adminUser.id;
console.log("✅ Usuário encontrado:", adminUserId);

// Membro owner (super admin = papel owner no schema)
const { data: existingMember } = await supabase
  .from("membros")
  .select("papel")
  .eq("org_id", orgId)
  .eq("user_id", adminUserId)
  .maybeSingle();

if (existingMember) {
  if (existingMember.papel !== "owner") {
    const { error: updErr } = await supabase
      .from("membros")
      .update({ papel: "owner" })
      .eq("org_id", orgId)
      .eq("user_id", adminUserId);
    if (updErr) {
      console.error("❌ Erro ao promover para owner:", updErr.message);
      process.exit(1);
    }
    console.log("✅ Usuário promovido para owner");
  } else {
    console.log("ℹ️  Usuário já é owner desta organização");
  }
} else {
  const { error: memErr } = await supabase.from("membros").insert({
    org_id: orgId,
    user_id: adminUserId,
    papel: "owner",
  });
  if (memErr) {
    console.error("❌ Erro ao vincular membro:", memErr.message);
    process.exit(1);
  }
  console.log("✅ Membro owner vinculado");
}

console.log("");
console.log("Pronto! Acesse /org/selecionar");
console.log(`  E-mail: ${ADMIN_EMAIL}`);
console.log(`  UID:    ${adminUserId}`);
console.log(`  Papel:  owner (administrador máximo)`);
