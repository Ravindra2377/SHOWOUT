import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "SHOWOUT", short_name: "SHOWOUT", description: "Don’t scroll. Show out.", start_url: "/arcade", display: "standalone", background_color: "#f4f0e7", theme_color: "#ff3b1f", icons: [] };
}
