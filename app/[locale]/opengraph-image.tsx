import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

// Anteprima per la condivisione del link (LinkedIn, WhatsApp, Slack...).
// Nessun font né risorsa remota: ImageResponse usa il font incluso in Next,
// e il motivo (sfera con stelle, ispirato alle sfere del drago) è geometria
// pura. Testo dal dizionario Meta, nella lingua della pagina.
export const alt = "Lorenzo De Luca";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STELLE = [
  { left: 105, top: 105 },
  { left: 215, top: 105 },
  { left: 105, top: 215 },
  { left: 215, top: 215 },
];

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #0b0e14 0%, #141a26 100%)",
          color: "#f3f0e7",
          padding: "0 80px",
        }}
      >
        <div style={{ display: "flex", position: "relative", width: 360, height: 360, flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 360,
              height: 360,
              borderRadius: 180,
              background: "radial-gradient(circle at 35% 30%, #f6b44c 0%, #e8870f 55%, #7e2537 100%)",
              display: "flex",
            }}
          />
          {STELLE.map((s) => (
            <div
              key={`${s.left}-${s.top}`}
              style={{
                position: "absolute",
                left: s.left,
                top: s.top,
                width: 40,
                height: 40,
                borderRadius: 20,
                background: "#7e2537",
                opacity: 0.85,
                display: "flex",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 70, width: 620 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, display: "flex" }}>Lorenzo De Luca</div>
          <div style={{ fontSize: 36, color: "#f6b44c", marginTop: 28, lineHeight: 1.3, display: "flex" }}>
            {t("jobTitle")}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
