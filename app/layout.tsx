import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Archivio personale",
  description: "Archivio personale — spese, collezione e agenda.",
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
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t);else if(window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
