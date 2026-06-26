"use client";

export interface RelCardDef<T = Record<string, unknown>> {
  id: string;
  label: string;
  sub: string;
  value?: string;
  filter?: (row: T) => boolean;
  total?: boolean;
  ind?: boolean;
  clickable?: boolean;
}

export function RelCards<T = Record<string, unknown>>({
  cards,
  active,
  onPick,
  staticCards,
  defaultCard = "todos",
}: {
  cards: RelCardDef<T>[];
  active: string;
  onPick?: (id: string) => void;
  staticCards?: boolean;
  defaultCard?: string;
}) {
  return (
    <div className={`nx-rel-cards${staticCards ? " is-static" : ""}`}>
      {cards.map((c) => {
        const clickable = !staticCards && !c.total && c.clickable !== false;
        return (
          <div
            key={c.id}
            className={[
              "nx-rel-card",
              active === c.id && !c.ind ? "is-active" : "",
              c.total ? "is-total" : "",
              c.ind ? "is-ind" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={
              clickable && onPick
                ? () => onPick(active === c.id ? defaultCard : c.id)
                : undefined
            }
            onKeyDown={
              clickable && onPick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPick(active === c.id ? defaultCard : c.id);
                    }
                  }
                : undefined
            }
          >
            <div className="nx-rel-card-label">{c.label}</div>
            <div className="nx-rel-card-value">{c.value ?? "0"}</div>
            <div className="nx-rel-card-sub">{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
