import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://noteswallah.co.in",
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: "https://noteswallah.co.in/browse",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://noteswallah.co.in/premium",
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: "https://noteswallah.co.in/feedback",
      lastModified: new Date(),
      priority: 0.6,
    },
  ];
}