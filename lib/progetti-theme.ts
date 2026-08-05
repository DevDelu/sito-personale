import type { ProjectAccentColors } from "@/types/project";

// Fallback quando un progetto non definisce accentColors: l'ambra del
// design system generale, riusata sui tre slot (primary/secondary/tertiary).
export const DEFAULT_ACCENT: ProjectAccentColors = {
  primary: "#c25a1e",
  secondary: "#c25a1e",
  tertiary: "#c25a1e",
};

export function getAccentColors(accent?: ProjectAccentColors): ProjectAccentColors {
  return accent ?? DEFAULT_ACCENT;
}
