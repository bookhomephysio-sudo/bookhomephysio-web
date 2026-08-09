"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OnboardPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [quals, setQs] = useState("");
  const [exp, setExp] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [phone, setPhone] = useState("");
  const [citySel, setCitySel] = useState("");
  const [otherCity, setOtherCity] = useState("");
  const [addr, setAddr] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [avatar, setAvatar] = useState("");
  const [govId, setGovId] = useState("");
  const [cert, setCert] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async (id: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    setProfile(data);
    setQs(data?.qualifications ?? "");
    setExp(data?.experience_years != null ? String(data.experience_years) : "");
    setBio(data?.bio ?? "");
    setRate(data?.hourly_rate != null ? String(data.hourly_rate) : "");
    setPhone(data?.phone ?? "");
    setAddr(data?.address ?? "");
    setCitySel(data?.city ?? "");
    const { data: ar } = await supabase.from("areas").select("city");
    setCities(Array.from(new Set((ar ?? []).map((a: any) => a.city)) as string[]));
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUid(session.user.id);
      await load(session.user.id);
    })();
  }, []);

  const upload = async (file: File, bucket: string, folder: string) => {
    const path = `${folder}/${uid}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw new Error(error.message);
    if (bucket === "avatars") {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    return path;
  };

  const submit = async () => {
    if (!avatar || !govId || !cert) return setMsg("Please upload photo, govt ID and degree certificate.");
    if (!quals || !bio || !rate) return setMsg("Please fill degrees, bio and base rate.");
    if (!phone.trim() || !addr.trim() || (!citySel && !otherCity.trim()))
      return setMsg("Please add your phone, city and residence address.");
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("profiles").update({
      qualifications: quals,
      experience_years: exp ? Number(exp) : null,
      bio,
      hourly_rate: Number(rate),
      avatar_url: avatar,
      kyc_id_url: govId,
      kyc_cert_url: cert,
      phone: phone.trim(),
      address: addr.trim(),
      city: citySel === "other" ? otherCity.trim() : citySel,
      requested_city: citySel === "other" ? otherCity.trim() : null,
      kyc_status: "submitted",
    }).eq("id", uid);
    setBusy(false);
    if (error) return setMsg(error.message);
    await load(uid!);
  };

  if (!profile) return <main className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading…</main>;
  if (profile.role !== "physio") return <main className="min-h-screen bg-slate-50 p-8 text-slate-600">This page is for physiotherapists.</main>;

  if (profile.kyc_status === "submitted") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <p className="text-4xl">⏳</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Application under review</h1>
          <p className="mt-2 text-sm text-slate-600">Our team is verifying your documents. You'll be live once approved — usually within 24 hours.</p>
        </div>
      </main>
    );
  }

  if (profile.kyc_status === "approved") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <p className="text-4xl">✅</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">You're verified!</h1>
          <a href="/physio-dashboard" className="mt-4 inline-block rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white">Go to your dashboard →</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">Complete your professional profile</h1>
        <p className="mt-1 text-slate-600">This information builds patient trust and is verified before you go live.</p>

        <div className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow">
          <div>
            <label className="text-sm font-medium text-slate-700">Professional photo</label>
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setAvatar(await upload(f, "avatars", "photos"));
              }} />
            {avatar && <p className="mt-1 text-sm text-green-700">✅ Photo uploaded</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Degrees (e.g. BPT, MPT Orthopedics)</label>
            <input value={quals} onChange={(e) => setQs(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Years of experience</label>
              <input type="number" value={exp} onChange={(e) => setExp(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Base rate ₹/session</label>
              <input type="number" value={rate} onChange={(e) => setRate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Short bio for patients</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Phone (patients & platform contact)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+91…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Your city</label>
              <select value={citySel} onChange={(e) => setCitySel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Select…</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="other">Other city</option>
              </select>
            </div>
            {citySel === "other" && (
              <div>
                <label className="text-sm font-medium text-slate-700">Which city?</label>
                <input value={otherCity} onChange={(e) => setOtherCity(e.target.value)} placeholder="e.g. Delhi"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Current residence address</label>
            <textarea rows={2} value={addr} onChange={(e) => setAddr(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Govt ID (Aadhaar/PAN) — private, admin only</label>
            <input type="file" accept="image/*,.pdf" className="mt-1 block w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setGovId(await upload(f, "kyc", "govt-id"));
              }} />
            {govId && <p className="mt-1 text-sm text-green-700">✅ ID uploaded (locked 🔒)</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Degree certificate — private, admin only</label>
            <input type="file" accept="image/*,.pdf" className="mt-1 block w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setCert(await upload(f, "kyc", "certificate"));
              }} />
            {cert && <p className="mt-1 text-sm text-green-700">✅ Certificate uploaded (locked 🔒)</p>}
          </div>

          <button onClick={submit} disabled={busy}
            className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
            {busy ? "Submitting…" : "Submit for verification"}
          </button>
          {msg && <p className="text-center text-sm text-red-600">{msg}</p>}
        </div>
      </div>
    </main>
  );
}