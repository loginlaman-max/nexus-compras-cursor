"use client";

import { useCallback, useState } from "react";
import { CheckCircle } from "lucide-react";

export function useSaveToast() {
  const [msg, setMsg] = useState<string | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2600);
  }, []);

  const node = msg ? (
    <div className="nx-tp-toast">
      <CheckCircle size={15} /> {msg}
    </div>
  ) : null;

  return { show, node };
}
