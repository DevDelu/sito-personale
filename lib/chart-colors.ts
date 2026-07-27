// Palette categorica validata (CVD-safe, fixed order — mai ciclata).
// Vedi skill "dataviz": slot 1-7 per le categorie reali, "Altro" usa il grigio muted.
export const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
] as const;

export const CATEGORICAL_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
] as const;

export const ALTRO_COLOR = { light: "#898781", dark: "#898781" };

export const SEQUENTIAL_BLUE = { light: "#2a78d6", dark: "#3987e5" };

export const SUCCESS_COLOR = { light: "#006300", dark: "#0ca30c" };
export const DANGER_COLOR = { light: "#dc2626", dark: "#f87171" };

export function categoricalScale(isDark: boolean) {
  return isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}
