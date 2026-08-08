"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [kyc, setKyc] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async (uid: string) => {
      const { data: prof } = await supabase
        .from("profiles").select("role, kyc_status").eq("id", uid).single();
      setRole(prof?.role ?? null);
      setKyc(prof?.kyc_status ?? null);
    };
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);
      if (session) await fetchProfile(session.user.id);
      const { data: listener } = supabase.auth.onAuthStateChange(async (_e, sess) => {
        setUserId(sess?.user.id ?? null);
        if (!sess) { setRole(null); setKyc(null); }
        else await fetchProfile(sess.user.id);
      });
      return () => listener.subscription.unsubscribe();
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/">
          <img src="/logo.png" alt="BookHomePhysio" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium text-slate-700">
          <Link href="/physios" className="hover:text-teal-700">Find Physios</Link>
          {userId && role !== "physio" && role !== "admin" && (
            <Link href="/bookings" className="hover:text-teal-700">My Bookings</Link>
          )}
          {userId && role === "physio" && kyc === "approved" && (
            <Link href="/physio-dashboard" className="hover:text-teal-700">Dashboard</Link>
          )}
          {userId && role === "physio" && kyc === "approved" && (
            <Link href="/practice" className="hover:text-teal-700">My Practice</Link>
          )}
          {userId && role === "physio" && kyc !== "approved" && (
            <Link href="/onboard" className="hover:text-teal-700">Onboarding</Link>
          )}
          {userId && role === "admin" && (
            <Link href="/admin" className="hover:text-teal-700">Admin</Link>
          )}
          {userId ? (
            <button onClick={logout} className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200">Logout</button>
          ) : (
            <Link href="/auth" className="rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}