import { HN_SIT_LABEL } from "@/lib/entrada/hn-data";

export function HnSitPill({ s }: { s: string }) {
  const cfg = HN_SIT_LABEL[s] ?? { lb: s, tone: "ok" as const };
  return (
    <span className={`nx-hn-pill is-${cfg.tone}`}>
      <span className="dot" />
      {cfg.lb}
    </span>
  );
}
