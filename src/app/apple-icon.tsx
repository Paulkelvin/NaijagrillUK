import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          background: "#160f0b",
          color: "#d19a3a",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 104, fontWeight: 600, lineHeight: 1 }}>N</div>
        <div
          style={{
            marginTop: 8,
            fontSize: 16,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#f7f4ef",
          }}
        >
          NaijaGrill
        </div>
      </div>
    ),
    { ...size },
  );
}
