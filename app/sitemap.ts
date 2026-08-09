import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://bookhomephysio.com";
  const { data: physios } = await supabase
    .from("profiles").select("id").eq("role", "physio").eq("kyc_status", "approved");
  const { data: areas } = await supabase.from("areas").select("city");
  const cities = Array.from(new Set((areas ?? []).map((a: any) => a.city.toLowerCase())));

  return [
    { url: base, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/physios`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.6 },
    ...cities.map((c) => ({ url: `${base}/physios/${c}`, changeFrequency: "daily", priority: 0.8 })),
    ...(physios ?? []).map((p: any) => ({ url: `${base}/book/${p.id}`, changeFrequency: "weekly", priority: 0.7 })),
  ] as MetadataRoute.Sitemap;
}