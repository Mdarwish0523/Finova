import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg,#3869ee,#173cae)", color: "white", fontSize: 230, fontWeight: 800, letterSpacing: -18 }}>F</div>,
    size,
  );
}
