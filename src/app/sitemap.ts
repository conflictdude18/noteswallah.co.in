import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://noteswallah.co.in",
      lastModified: new Date(),
    },
    {
      url: "https://noteswallah.co.in/browse",
      lastModified: new Date(),
    },
    {
      url: "https://noteswallah.co.in/signin",
      lastModified: new Date(),
    },
  ];
}