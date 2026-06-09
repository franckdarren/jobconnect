import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JobConnect",
    short_name: "JobConnect",
    description: "L'emploi direct au Gabon",
    start_url: "/",
    display: "standalone",
    background_color: "#0D1B2A",
    theme_color: "#0D1B2A",
    orientation: "portrait",
    lang: "fr",
    categories: ["business", "productivity"],
    // SVG fallback while PNG icons (192/512/maskable) are produced for prod.
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
