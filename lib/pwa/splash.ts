// Schermate di avvio iOS (apple-touch-startup-image): sfondo come
// background_color del manifest con l'icona al centro. File statici in
// public/splash/ (generati una tantum, nessun costo a runtime).
// Larghezza/altezza in punti CSS + densità; i file sono in pixel reali.
export const SPLASH_IPHONE = [
  { w: 375, h: 812, dpr: 3 }, // X, XS, 11 Pro, 12/13 mini
  { w: 390, h: 844, dpr: 3 }, // 12, 13, 14
  { w: 393, h: 852, dpr: 3 }, // 14 Pro, 15, 16
  { w: 428, h: 926, dpr: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 430, h: 932, dpr: 3 }, // 14 Pro Max, 15 Plus/Pro Max
] as const;

export function percorsoSplash(s: { w: number; h: number; dpr: number }): string {
  return `/splash/splash-${s.w * s.dpr}x${s.h * s.dpr}.png`;
}

export function mediaSplash(s: { w: number; h: number; dpr: number }): string {
  return `screen and (device-width: ${s.w}px) and (device-height: ${s.h}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: portrait)`;
}
