import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vaapsi — Lost & Found for KIIT University",
    short_name: "Vaapsi",
    description:
      "Lost something on campus? Found someone's belongings? Vaapsi helps KIIT students recover lost items.",
    start_url: "/",
    display: "standalone",
    background_color: "#080c18",
    theme_color: "#185FA5",
    icons: [
      {
        src: "/vaapsi-logo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/vaapsi-logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}