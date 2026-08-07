"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setRole(profile?.role ?? null);
      } else {
        setRole(null);
      }
    };

    refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(refresh, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold text-teal-700">🏠 BookHomePhysio</Link>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/physios" className="hover:text-teal-700">Find Physios</Link>
          {loggedIn && <Link href="/bookings" className="hover:text-teal-700">My Bookings</Link>}
          {loggedIn && role === "physio" && (
            <Link href="/dashboard" className="hover:text-teal-700">Dashboard</Link>
          )}
          {loggedIn ? (
            <button onClick={logout} className="rounded-lg bg-slate-100 px-3 py-1.5 hover:bg-slate-200">
              Logout
            </button>
          ) : (
            <Link href="/auth" className="rounded-lg bg-teal-600 px-3 py-1.5 text-white hover:bg-teal-700">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}