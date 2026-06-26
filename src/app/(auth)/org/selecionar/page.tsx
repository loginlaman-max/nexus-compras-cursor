import { Building2, LogOut } from "lucide-react";
import { OrgSelector } from "@/components/auth/org-selector";
import { signOut } from "@/lib/auth/actions";
import { getUserMemberships } from "@/lib/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function OrgSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const memberships = await getUserMemberships();

  return (
    <Card className="nx-auth-card w-full max-w-[520px]">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Selecionar organização
            </CardTitle>
            <CardDescription className="text-xs">
              Escolha a empresa com a qual deseja trabalhar. O acesso é
              controlado por organização (RLS).
            </CardDescription>
          </div>
          <Building2 className="size-5 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {memberships.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
            <p className="type-body text-muted-foreground">
              Sua conta ainda não está vinculada a nenhuma organização.
            </p>
            <p className="type-caption mt-2">
              Peça a um administrador para enviar um convite ou adicionar você
              em <span className="mono">membros</span>.
            </p>
          </div>
        ) : (
          <OrgSelector
            memberships={memberships}
            redirectTo={params.redirect}
          />
        )}

        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            <LogOut className="size-3.5" />
            Sair da conta
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
