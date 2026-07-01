import { Suspense } from "react";
import { ConfiguracoesPageView } from "@/components/sistema/configuracoes-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfiguracoesPageView />
    </Suspense>
  );
}
