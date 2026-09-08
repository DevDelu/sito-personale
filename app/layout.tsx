import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radar",
  description: "Radar — spese, investimenti, collezione e agenda personali.",
};

// viewportFit "cover": disegna sotto la notch/home-indicator invece di
// lasciare una barra bianca, così le padding con env(safe-area-inset-*)
// nei componenti fixed (drawer, barre in basso, toast) hanno un valore
// reale da usare invece di 0.
//
// themeColor: senza questo, Safari colora l'area di sistema (dietro
// notch/Dynamic Island, e la fascia rivelata dal rubber-band scroll) di
// nero di default in dark mode, indipendentemente dallo sfondo reale della
// pagina — è quello che si vedeva come "barra nera" sopra l'header. Le due
// varianti seguono la preferenza di sistema; InlineScript + ThemeToggle
// tengono il tag sincronizzato quando l'utente sceglie un tema manualmente,
// diverso da quello di sistema.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      data-theme="light"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t);else if(window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.setAttribute("data-theme","dark");var c=document.documentElement.getAttribute("data-theme")==="dark"?"#0b0e14":"#faf6ee";document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})}catch(e){}})()`}
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground">{children}</body>
    </html>
  );
}
