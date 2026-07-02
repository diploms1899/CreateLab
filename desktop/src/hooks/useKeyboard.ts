import { useEffect } from "react";

export function useKeyboard(
  handlers: Record<string, (e: KeyboardEvent) => void>,
  deps: any[] = []
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = [
        e.ctrlKey && "Ctrl",
        e.metaKey && "Meta",
        e.shiftKey && "Shift",
        e.altKey && "Alt",
        e.key,
      ]
        .filter(Boolean)
        .join("+");
      if (handlers[key]) {
        e.preventDefault();
        handlers[key](e);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, deps);
}
