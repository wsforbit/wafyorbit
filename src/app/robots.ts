import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://wafyorbit.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/orbit-details",
          "/orbit-details/orbits",
          "/orbit-details/students",
          "/orbit-details/colleges",
          "/orbit-details/leaders",
          "/auth/login",
        ],
        disallow: [
          "/admin/",
          "/college/",
          "/orbit/",
          "/portal/",
          "/auth/callback",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
