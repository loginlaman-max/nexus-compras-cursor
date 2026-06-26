import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findNavItemByHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function ComingSoonPage({ pathname }: { pathname: string }) {
  const nav = findNavItemByHref(pathname);
  const title = nav?.label ?? "Módulo";
  const Icon = nav?.icon ?? Construction;

  return (
    <div>
      <div className="nx-pageheader">
        <div>
          <h1 className="type-h1 m-0">{title}</h1>
          <p className="type-caption mt-0.5">
            Módulo previsto no protótipo — implementação em breve
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4 text-primary" />
            Em construção
          </CardTitle>
          <CardDescription>
            O shell e a navegação já funcionam. Esta tela será recriada a partir
            do protótipo visual (<code className="mono text-[11px]">components/*.jsx</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="nx-stub !py-10 !max-w-none">
            <Construction className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="type-body">
              Rota <code className="mono text-[11px]">{pathname}</code> ainda
              não tem página no App Router.
            </p>
          </div>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="size-3.5" />
            Voltar ao Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
