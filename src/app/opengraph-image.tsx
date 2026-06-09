import { ImageResponse } from "next/og";

export const alt = "NaijaGrill — Premium Nigerian Restaurant in Handsworth, Birmingham";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#1a1814",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#b8956c",
            marginBottom: 24,
          }}
        >
          Handsworth · Birmingham
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 300,
            color: "#f7f4ef",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          NaijaGrill
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#8c8578",
            marginTop: 32,
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Premium Nigerian cuisine on Rookery Road
        </div>
      </div>
    ),
    { ...size },
  );
}
