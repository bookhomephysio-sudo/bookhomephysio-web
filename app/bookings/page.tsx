"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUS_UI: Record<string, string> = {
  pending_acceptance: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  const load = async (uid: string) => {
    const [bk, rv] = await Promise.all([
      supabase
        .from("bookings")
        .select("*, services(name), profiles!bookings_physio_id_fkey(full_name, avatar_url, phone)")
        .eq("patient_id", uid)
        .order("start_time", { ascending: false }),
      supabase.from("reviews").select("booking_id").eq("patient_id", uid),
    ]);
    setBookings(bk.data ?? []);
    const rmap: Record<string, boolean> = {};
    (rv.data ?? []).forEach((r: any) => { rmap[r.booking_id] = true; });
    setReviewed(rmap);
    setLoaded(true);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await load(session.user.id);
    })();
  }, []);

  const me = async () => (await supabase.auth.getSession()).data.session?.user.id;

  const cancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    const uid = await me();
    if (uid) await load(uid);
  };

  const submitReview = async (b: any) => {
    const uid = await me();
    const { error } = await supabase.from("reviews").insert({
      booking_id: b.id, physio_id: b.physio_id, patient_id: uid, rating: stars, comment,
    });
    if (error) return alert(error.message);
    setReviewFor(null); setStars(5); setComment("");
    if (uid) await load(uid);
  };

  const upcoming = bookings.filter((b) => b.status === "pending_acceptance" || b.status === "accepted");
  const history = bookings.filter((b) => b.status !== "pending_acceptance" && b.status !== "accepted");

  const Card = ({ b }: { b: any }) => (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {b.profiles?.avatar_url ? (
            <img src={b.profiles.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">{b.profiles?.full_name?.[0]}</div>
          )}
          <div>
            <p className="font-semibold text-slate-900">{b.profiles?.full_name}</p>
            <p className="text-sm text-slate-500">{b.services?.name} · {new Date(b.start_time).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_UI[b.status] ?? "bg-slate-100 text-slate-600"}`}>
          {b.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-slate-900">₹{b.amount}</span>
        {b.status === "accepted" && b.profiles?.phone && (
          <a href={`tel:${b.profiles.phone}`} className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100">
            📞 Call physio: {b.profiles.phone}
          </a>
        )}
        {b.status === "pending_acceptance" && (
          <button onClick={() => cancel(b.id)} className="rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-600 hover:bg-red-100">Cancel</button>
        )}
        {b.status === "completed" && !reviewed[b.id] && (
          <button onClick={() => setReviewFor(reviewFor === b.id ? null : b.id)} className="rounded-lg bg-amber-50 px-3 py-1.5 font-medium text-amber-700 hover:bg-amber-100">⭐ Rate session</button>
        )}
        {b.status === "completed" && reviewed[b.id] && (
          <span className="text-xs text-slate-400">Reviewed ✓</span>
        )}
      </div>

      {reviewFor === b.id && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} className={`text-xl ${n <= stars ? "text-amber-400" : "text-slate-300"}`}>★</button>
            ))}
          </div>
          <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the session?"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={() => submitReview(b)} className="mt-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Submit review</button>
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Upcoming</h2>
      <div className="mt-3 max-w-2xl space-y-4">
        {!loaded && <p className="text-slate-500">Loading…</p>}
        {loaded && upcoming.length === 0 && <p className="text-slate-500">No upcoming bookings. <a className="font-medium text-teal-700 hover:underline" href="/physios">Find a physio</a></p>}
        {upcoming.map((b) => <Card key={b.id} b={b} />)}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">History</h2>
      <div className="mt-3 max-w-2xl space-y-4">
        {history.map((b) => <Card key={b.id} b={b} />)}
        {loaded && history.length === 0 && <p className="text-slate-500">Nothing yet.</p>}
      </div>
    </main>
  );
}