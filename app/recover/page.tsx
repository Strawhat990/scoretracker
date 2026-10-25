"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DEVICE_ID_KEY = "mba-tracker:device-id";
const PROFILE_ID_KEY = "mba-tracker:profile-id";

interface ProfileResult {
  id: string;
  name: string | null;
  reg_no: string | null;
}

type Step = "search" | "results" | "confirm" | "success";

export default function RecoverPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [selected, setSelected] = useState<ProfileResult | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem(DEVICE_ID_KEY);
    setDeviceId(id);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const q = query.trim();
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, name, reg_no")
        .or(`name.ilike.%${q}%,reg_no.ilike.%${q}%`)
        .limit(10);

      if (err) throw err;
      if (!data || data.length === 0) {
        setError("No profiles found. Try your name or registration number exactly as you entered it.");
        setResults([]);
      } else {
        setResults(data as ProfileResult[]);
        setStep("results");
      }
    } catch (err: any) {
      setError(err.message ?? "Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selected || !deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("devices").upsert({
        device_id: deviceId,
        profile_id: selected.id,
        last_seen_at: new Date().toISOString(),
      });
      if (err) throw err;
      localStorage.setItem(PROFILE_ID_KEY, selected.id);
      setStep("success");
    } catch (err: any) {
      setError(err.message ?? "Failed to relink device. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-white/40 mb-2">
          MBA · Grade Tracker
        </p>
        <h1 className="font-serif text-2xl font-bold text-white">
          Recover Your Data
        </h1>
        <p className="mt-2 text-sm text-white/50 max-w-sm mx-auto">
          Enter your name or registration number to reconnect this device to your existing marks.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-2xl">

        {/* Step: Search */}
        {(step === "search" || step === "results") && (
          <>
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <label className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                Name or Reg No
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setStep("search");
                  setResults([]);
                  setError(null);
                }}
                placeholder="e.g. Philip or 2410506"
                className="glass-input text-left px-4"
                style={{ textAlign: "left" }}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="mt-1 rounded-full bg-sky-500/20 border border-sky-400/30 px-5 py-2.5 text-sm font-semibold text-sky-300 transition-all hover:bg-sky-500/30 hover:text-sky-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </form>

            {error && (
              <p className="mt-4 text-sm text-rose-400/80 text-center">{error}</p>
            )}

            {/* Results list */}
            {results.length > 0 && (
              <div className="mt-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-3">
                  {results.length} profile{results.length > 1 ? "s" : ""} found — pick yours
                </p>
                <div className="flex flex-col gap-2">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelected(p); setStep("confirm"); }}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-all hover:border-sky-400/40 hover:bg-white/[0.07]"
                    >
                      <div>
                        <p className="font-medium text-white text-sm">
                          {p.name || <span className="text-white/30 italic">No name set</span>}
                        </p>
                        <p className="font-mono text-[11px] text-white/40 mt-0.5">
                          {p.reg_no || "No reg no"}
                        </p>
                      </div>
                      <svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selected && (
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-2">
                Confirm your profile
              </p>
              <p className="text-lg font-bold text-white">
                {selected.name || "—"}
              </p>
              <p className="font-mono text-sm text-white/50 mt-1">
                {selected.reg_no || "No reg no"}
              </p>
            </div>

            <p className="text-xs text-white/40 text-center">
              This will link your current device to the above profile and restore all your marks.
            </p>

            {error && (
              <p className="text-sm text-rose-400/80 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("results"); setSelected(null); setError(null); }}
                className="flex-1 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/30 hover:text-emerald-200 disabled:opacity-40"
              >
                {loading ? "Linking…" : "Yes, restore my data"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10">
              <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-white">Data Restored!</p>
              <p className="mt-1 text-sm text-white/50">
                Device linked to <span className="text-white font-medium">{selected?.name}</span>. Your marks are back.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded-full bg-sky-500/20 border border-sky-400/30 px-6 py-2.5 text-sm font-semibold text-sky-300 transition-all hover:bg-sky-500/30 hover:text-sky-200"
            >
              Go to Grade Tracker →
            </button>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-6 text-center text-[11px] text-white/25 font-mono">
        Can't find your profile? Contact Philip Samuel Rajan A Y
      </p>
    </main>
  );
}
