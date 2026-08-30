import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finova Personal Finance",
    short_name: "Finova",
    description: "Private personal finance tracking, recurring bills, reports, and insights.",
    start_url: "/protected",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f8fc",
    theme_color: "#f7f8fc",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
