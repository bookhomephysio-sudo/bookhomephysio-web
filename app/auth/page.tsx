"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [asPhysio, setAsPhysio] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectByRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push("/physios");
    const { data: prof } = await supabase
      .from("profiles").select("role, kyc_status").eq("id", session.user.id).single();
    if (prof?.role === "admin") router.push("/admin");
    else if (prof?.role === "physio") router.push(prof.kyc_status === "approved" ? "/physio-dashboard" : "/onboard");
    else router.push("/bookings");
  };

  const submit = async () => {
    setBusy(true);
    setMsg("");
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMsg(error.message); setBusy(false); return; }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: asPhysio ? "physio" : "patient" } },
      });
      if (error) { setMsg(error.message); setBusy(false); return; }
      await supabase.auth.signInWithPassword({ email, password });
    }
    await redirectByRole();
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <img src="/logo.png" alt="BookHomePhysio" className="mx-auto mb-4 h-24 w-auto" />
        <h1 className="text-center text-2xl font-bold text-slate-900">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>

        <div className="mt-6 space-y-4">
          {!isLogin && (
            <>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" />
              <label className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm text-teal-800">
                <input type="checkbox" checked={asPhysio} onChange={(e) => setAsPhysio(e.target.checked)} />
                I'm a physiotherapist — I want to offer services
              </label>
            </>
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" />
          <button onClick={submit} disabled={busy}
            className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
            {busy ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
          </button>
          {msg && <p className="text-center text-sm text-red-600">{msg}</p>}
          <p className="text-center text-sm text-slate-500">
            {isLogin ? "New here?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-teal-700 hover:underline">
              {isLogin ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}