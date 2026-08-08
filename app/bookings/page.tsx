"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUS_COLORS: Record<string, string> = {
  payment_pending: "bg-amber-100 text-amber-700",
  pending_acceptance: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  en_route: "bg-purple-100 text-purple-700",
  in_session: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-200 text-slate-600",
  refunded: "bg-slate-200 text-slate-600",
  disputed: "bg-red-100 text-red-700",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async (uid: string) => {
    const { data } = await supabase
      .from("bookings")
      .select("id, physio_id, start_time, status, amount, patient_address, reviews(id), profiles!bookings_physio_id_fkey(full_name)")
      .eq("patient_id", uid)
      .order("start_time", { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        await load(session.user.id);
      } else setLoading(false);
    })();
  }, []);

  const submitReview = async (booking: any) => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      physio_id: booking.physio_id,
      patient_id: userId,
      rating,
      comment,
    });
    setSaving(false);
    if (error) alert(error.message);
    else {
      setReviewFor(null);
      setRating(5);
      setComment("");
      await load(userId);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
      {loading ? (
        <p className="mt-6 text-slate-500">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="mt-6 text-slate-500">
          No bookings yet. <a className="text-teal-600 underline" href="/physios">Find a physio</a>
        </p>
      ) : (
        <div className="mt-6 max-w-2xl space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="rounded-2xl bg-white p-5 shadow">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">{b.profiles?.full_name}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[b.status] ?? "bg-slate-200 text-slate-600"}`}>
                  {b.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{new Date(b.start_time).toLocaleString()} · ₹{b.amount}</p>
              <p className="mt-1 text-sm text-slate-500">{b.patient_address?.full_address}</p>

              {b.status === "completed" && (b.reviews ?? []).length === 0 && (
                reviewFor === b.id ? (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-700">Rate your session</p>
                    <div className="mt-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setRating(n)}
                          className={`text-2xl ${n <= rating ? "text-amber-400" : "text-slate-300"}`}>★</button>
                      ))}
                    </div>
                    <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)}
                      placeholder="How was the session? (optional)"
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => submitReview(b)} disabled={saving}
                        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                        {saving ? "Saving..." : "Submit review"}
                      </button>
                      <button onClick={() => setReviewFor(null)}
                        className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReviewFor(b.id)}
                    className="mt-3 rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-200">
                    ⭐ Leave a review
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}