import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://vaapsi.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/banned/", "/my-posts/", "/my-claims/", "/handoff/", "/handoffs/", "/notifications/", "/profile/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}