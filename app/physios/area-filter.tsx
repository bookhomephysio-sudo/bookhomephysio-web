"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AreaFilter({ areas, current }: { areas: any[]; current: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");

  useEffect(() => {
    (async () => {
      if (current) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase
        .from("profiles").select("area_id").eq("id", session.user.id).single();
      if (prof?.area_id) {
        setValue(prof.area_id);
        router.replace(`/physios?area=${prof.area_id}`);
      }
    })();
  }, [current]);

  const change = async (id: string) => {
    setValue(id);
    router.push(id ? `/physios?area=${id}` : "/physios");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("profiles").update({ area_id: id || null }).eq("id", session.user.id);
    }
  };

  return (
    <select value={value} onChange={(e) => change(e.target.value)}
      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
      <option value="">️ All areas</option>
      {areas.map((a) => (
        <option key={a.id} value={a.id}>📍 {a.name}</option>
      ))}
    </select>
  );
}