import { useProjectStore } from "../stores/projectStore";

export function useTheme() {
  const getActiveTheme = useProjectStore((s) => s.getActiveTheme);
  return getActiveTheme();
}
