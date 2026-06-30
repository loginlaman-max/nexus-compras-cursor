import { Suspense } from "react";
import { CalcPrecosShell } from "@/components/ferramentas/calc-precos-shell";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CalcPrecosShell />
    </Suspense>
  );
}
