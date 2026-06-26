import { Boxes } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card className="nx-auth-card w-full max-w-[400px]">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="nx-auth-logo">
            <Boxes className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Nexus Compras
            </CardTitle>
            <CardDescription className="text-xs">
              Decisão de compra, precificação e custo real
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {params.error === "auth_callback" && (
          <p className="mb-4 rounded-md border border-status-ruptura/30 bg-status-ruptura/10 px-3 py-2 text-xs text-status-ruptura">
            Não foi possível concluir o login. Tente novamente.
          </p>
        )}
        <LoginForm redirectTo={params.redirect} />
      </CardContent>
    </Card>
  );
}
