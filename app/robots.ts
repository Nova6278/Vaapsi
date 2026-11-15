import type { MetadataRoute } from "next";
import { SITE_URL as siteUrl } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/banned/", "/my-posts/", "/my-claims/", "/handoff/", "/handoffs/", "/notifications/", "/profile/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}