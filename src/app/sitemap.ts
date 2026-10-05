import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const paths = ["", "/rcs", "/sms", "/whatsapp", "/telegram", "/gaming", "/pricing", "/developers", "/contact", "/faq", "/legal/terms", "/legal/privacy", "/legal/acceptable-use"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 }));
}
