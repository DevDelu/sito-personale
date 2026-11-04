import { ImageResponse } from "next/og";
import { getProjectBySlug } from "@/lib/projects";

// Anteprima social del singolo progetto (LinkedIn, WhatsApp...): titolo, sottotitolo
// e tag dal content layer, stessa grafica della home. Nessun font o risorsa remota.
export const alt = "Lorenzo De Luca";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProjectOpengraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const project = getProjectBySlug(slug, locale);
  const titolo = project?.title ?? "Lorenzo De Luca";
  const sottotitolo = project?.subtitle ?? "";
  const tag = (project?.tags ?? []).slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b0e14 0%, #141a26 100%)",
          color: "#f3f0e7",
          padding: "70px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: "radial-gradient(circle at 35% 30%, #f6b44c 0%, #e8870f 55%, #7e2537 100%)",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 30, color: "#f6b44c", marginLeft: 20, display: "flex" }}>Lorenzo De Luca</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05, display: "flex" }}>{titolo}</div>
          {sottotitolo && (
            <div style={{ fontSize: 38, marginTop: 24, lineHeight: 1.3, color: "#c9c5b8", display: "flex" }}>
              {sottotitolo}
            </div>
          )}
        </div>
        <div style={{ display: "flex" }}>
          {tag.map((t) => (
            <div
              key={t}
              style={{
                fontSize: 26,
                color: "#f6b44c",
                border: "2px solid #f6b44c",
                borderRadius: 999,
                padding: "6px 22px",
                marginRight: 14,
                display: "flex",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
