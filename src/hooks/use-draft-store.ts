"use client";

import { useCallback, useMemo, useState } from "react";
import { nxStore } from "@/lib/store/nx-store";

export function useDraftStore<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
) {
  const [draft, setDraft] = useState<T>(() => nxStore.get(key, defaults));
  const [saved, setSaved] = useState(draft);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );

  const setField = useCallback(<K extends keyof T>(k: K, v: T[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const save = useCallback(() => {
    nxStore.set(key, draft);
    setSaved(draft);
  }, [key, draft]);

  const reset = useCallback(() => {
    setDraft(saved);
  }, [saved]);

  return { draft, setDraft, setField, save, reset, dirty, saved };
}
