"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Send physios to dashboard, patients to the search page
  const redirectByRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    window.location.href = profile?.role === "physio" ? "/dashboard" : "/physios";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else await redirectByRole(data.user!.id);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) setError(error.message);
      else if (data.user) await redirectByRole(data.user.id);
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-slate-900">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">BookHomePhysio</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-600 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        <button
          onClick={() => { setIsLogin(!isLogin); setError(""); }}
          className="mt-4 w-full text-center text-sm text-teal-600 hover:underline"
        >
          {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </div>
    </main>
  );
}