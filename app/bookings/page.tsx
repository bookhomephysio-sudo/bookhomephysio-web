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

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("bookings")
          .select("id, start_time, status, amount, patient_address, profiles!bookings_physio_id_fkey(full_name)")
          .eq("patient_id", session.user.id)
          .order("start_time");
        setBookings(data ?? []);
      }
      setLoading(false);
    })();
  }, []);

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
              <p className="mt-1 text-sm text-slate-600">
                {new Date(b.start_time).toLocaleString()} · ₹{b.amount}
              </p>
              <p className="mt-1 text-sm text-slate-500">{b.patient_address?.full_address}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}