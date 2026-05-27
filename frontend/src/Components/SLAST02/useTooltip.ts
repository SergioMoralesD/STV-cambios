import { useState, useCallback } from "react";
import type { TooltipState } from "./types";

// ─── CUSTOM HOOK: TOOLTIP ──────────────────────────────────────────────────

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: "",
    x: 0,
    y: 0,
  });

  const show = useCallback((text: string, x: number, y: number) => {
    setTooltip({ visible: true, text, x, y });
  }, []);

  const move = useCallback((x: number, y: number, text: string) => {
    setTooltip((t) => ({ ...t, x, y, text }));
  }, []);

  const hide = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  return { tooltip, show, move, hide };
}
  