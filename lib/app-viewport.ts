import type { Viewport } from "next";

// Viewport dell'area "app" (area privata + login/recupera-password/reset
// password): oltre alla base di app/layout.tsx, blocca lo zoom (pinch e
// doppio-tap). Su iOS Safari/PWA, se un campo con font-size sotto i 16px
// viene messo a fuoco lo zoom scatta comunque; se poi il layout cambia
// (submit, cambio pagina, chiusura tastiera) prima che iOS resetti la scala,
// resta un'interfaccia rimpicciolita con una barra nera nello spazio
// scoperto dal viewport ridotto. maximumScale/userScalable eliminano la
// causa alla radice, indipendentemente dal riuscire a trovare ogni singolo
// campo sotto i 16px. Il sito pubblico non usa questa viewport: lì lo zoom
// resta disponibile.
export const appViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
  ],
};
