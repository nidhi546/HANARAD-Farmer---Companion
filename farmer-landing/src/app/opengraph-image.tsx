import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 120,
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "#fbbf24",
            boxShadow: "0 0 80px 20px rgba(251,191,36,0.45)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "linear-gradient(160deg, #92400e 0%, #d97706 45%, #fde68a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
            }}
          >
            🌾
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 46, fontWeight: 800, color: "#ffffff", letterSpacing: 2 }}>
              HANARAD
            </span>
            <span style={{ fontSize: 20, fontWeight: 600, color: "#6ee7b7", letterSpacing: 4 }}>
              FARMER COMPANION
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 54,
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.15,
          }}
        >
          Smart Farming,&nbsp;
          <span style={{ color: "#fbbf24" }}>Better Harvest.</span>
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 26,
            color: "#c7d2cc",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          NASA-powered weather · Satellite farm mapping · AI crop advice
        </div>
      </div>
    ),
    { ...size }
  );
}
