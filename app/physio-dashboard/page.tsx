"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const NEXT_ACTION: Record<string, { label: string; to: string }> = {
  pending_acceptance: { label: "Accept booking", to: "confirmed" },
  confirmed: { label: "I'm on the way", to: "en_route" },
  en_route: { label: "Start session", to: "in_session" },
  in_session: { label: "Complete session", to: "completed" },
};

const STATUS_COLORS: Record<string, string> = {
  pending_acceptance: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  en_route: "bg-purple-100 text-purple-700",
  in_session: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-200 text-slate-600",
  refunded: "bg-slate-200 text-slate-600",
  disputed: "bg-red-100 text-red-700",
};

export default function PhysioDashboard() {
  const [uid, setUid] = useState<string | null>(null);
  const [isPhysio, setIsPhysio] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async (id: string) => {
    const [prof, bk, rv] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("bookings")
        .select("id, start_time, status, amount, package_id, patient_address, profiles!bookings_patient_id_fkey(full_name), services(name), service_areas(area_name)")
        .eq("physio_id", id)
        .order("start_time", { ascending: false }),
      supabase.from("reviews")
        .select("rating, comment, created_at")
        .eq("physio_id", id)
        .order("created_at", { ascending: false }),
    ]);
    setProfile(prof.data);
    setBookings(bk.data ?? []);
    setReviews(rv.data ?? []);
    setName(prof.data?.full_name ?? "");
    setBio(prof.data?.bio ?? "");
    setRate(String(prof.data?.hourly_rate ?? ""));
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase
        .from("profiles").select("role").eq("id", session.user.id).single();
      if (prof?.role !== "physio") return;
      setIsPhysio(true);
      setUid(session.user.id);
      await load(session.user.id);
    })();
  }, []);

  const setStatus = async (bookingId: string, status: string) => {
    setBusy(bookingId);
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
    setBusy(null);
    if (error) return alert(error.message);
    await load(uid!);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles")
      .update({ full_name: name, bio, hourly_rate: Number(rate) })
      .eq("id", uid!);
    if (error) return alert(error.message);
    setEditing(false);
    await load(uid!);
  };

  if (!isPhysio) {
    return <main className="min-h-screen bg-slate-50 p-8 text-slate-600">Log in with a physio account to see your dashboard.</main>;
  }

  const active = bookings.filter((b) =>
    ["pending_acceptance", "confirmed", "en_route", "in_session"].includes(b.status));
  const completed = bookings.filter((b) => b.status === "completed");
  const earnings = completed.reduce((sum, b) => sum + Number(b.amount ?? 0), 0);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name}</h1>
      <p className="mt-1 text-slate-600">Your practice at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Active bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{active.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Sessions completed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{completed.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Total earnings</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">₹{earnings}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Rating</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">★ {Number(profile?.rating ?? 5).toFixed(1)} <span className="text-sm font-normal text-slate-400">({reviews.length})</span></p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900">Active bookings</h2>
            <div className="mt-4 space-y-4">
              {active.length === 0 && <p className="text-slate-500">No active bookings right now.</p>}
              {active.map((b) => (
                <div key={b.id} className="rounded-2xl bg-white p-5 shadow">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{b.profiles?.full_name ?? "Patient"}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(b.start_time).toLocaleString()} · {b.services?.name ?? "Session"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {b.service_areas?.area_name ? `📍 ${b.service_areas.area_name} · ` : ""}
                        {b.patient_address?.full_address}
                      </p>
                      {b.package_id && (
                        <span className="mt-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          Package booking
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[b.status] ?? "bg-slate-200 text-slate-600"}`}>
                        {b.status.replace(/_/g, " ")}
                      </span>
                      <span className="font-semibold text-slate-900">₹{b.amount}</span>
                      <div className="flex gap-2">
                        {b.status === "pending_acceptance" && (
                          <button onClick={() => setStatus(b.id, "cancelled")} disabled={busy === b.id}
                            className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-300 disabled:opacity-50">
                            Decline
                          </button>
                        )}
                        {NEXT_ACTION[b.status] && (
                          <button onClick={() => setStatus(b.id, NEXT_ACTION[b.status].to)} disabled={busy === b.id}
                            className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                            {NEXT_ACTION[b.status].label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">History</h2>
            <div className="mt-4 space-y-2">
              {completed.length === 0 && <p className="text-slate-500">No completed sessions yet.</p>}
              {completed.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl bg-white px-5 py-3 text-sm shadow">
                  <span className="text-slate-700">
                    {b.profiles?.full_name ?? "Patient"} · {new Date(b.start_time).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-green-700">₹{b.amount}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">My public profile</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-sm font-medium text-teal-700 hover:underline">Edit</button>
              )}
            </div>
            {editing ? (
              <div className="mt-4 space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Base rate ₹"
                  className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={saveProfile} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Save</button>
                  <button onClick={() => setEditing(false)} className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-700">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{profile?.full_name} · ₹{profile?.hourly_rate}/session</p>
                <p className="mt-1">{profile?.bio}</p>
                <a href="/practice"
                  className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                  Manage treatments, areas, hours & packages →
                </a>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900">Patient reviews</h2>
            <div className="mt-4 space-y-4">
              {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
              {reviews.map((r, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-4">
                  <span className="text-amber-400">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <p className="mt-1 text-sm text-slate-600">{r.comment || "Rated " + r.rating + " stars."}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}