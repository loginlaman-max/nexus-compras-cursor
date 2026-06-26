export function fmtBRL(n: number): string {
  return (
    "R$ " +
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function fmtInt(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function fmtCompactBRL(n: number): string {
  if (Math.abs(n) >= 1e6) {
    return (
      "R$ " +
      (n / 1e6).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) +
      "M"
    );
  }
  if (Math.abs(n) >= 1e3) {
    return (
      "R$ " +
      (n / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) +
      "k"
    );
  }
  return fmtBRL(n);
}

export function fmtPct(n: number): string {
  return (
    (n > 0 ? "+" : "") +
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) +
    "%"
  );
}
