"use client";

import { useState } from "react";
import { createSyncCode, redeemSyncCode } from "@/lib/device";

interface SyncModalProps {
  deviceId: string;
  profileId: string;
  onClose: () => void;
  onSynced: () => void; // called after a successful redeem, to reload data
}

const ACCENT = "#93C5FD";
const GLOW = "rgba(147,197,253,0.5)";

export default function SyncModal({ deviceId, profileId, onClose, onSynced }: SyncModalProps) {
  const [tab, setTab] = useState<"generate" | "enter">("generate");
  const [code, setCode] = useState<string | null>(null);
  const [entered, setEntered] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGenerate() {
    setStatus("loading");
    try {
      const c = await createSyncCode(profileId);
      setCode(c);
      setStatus("idle");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Couldn't generate a code. Try again.");
      setStatus("error");
    }
  }

  async function handleRedeem() {
    if (entered.length !== 6) return;
    setStatus("loading");
    try {
      const newProfileId = await redeemSyncCode(entered, deviceId);
      if (!newProfileId) {
        setErrorMsg("That code is invalid or has expired.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setTimeout(() => {
        onSynced();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Couldn't sync. Try again.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div
        className="glass-panel w-full max-w-sm rounded-t-card p-5 sm:rounded-card"
        style={{ boxShadow: `0 0 40px 4px ${GLOW}, 0 20px 60px rgba(0,0,0,0.5)` }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-white">Sync device</h2>
          <button onClick={onClose} className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 flex rounded-[10px] bg-white/5 p-1">
          <button
            onClick={() => setTab("generate")}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              tab === "generate" ? "bg-white/15 text-white" : "text-white/45"
            }`}
          >
            This is my primary device
          </button>
          <button
            onClick={() => setTab("enter")}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              tab === "enter" ? "bg-white/15 text-white" : "text-white/45"
            }`}
          >
            I have a code
          </button>
        </div>

        {tab === "generate" && (
          <div className="text-center">
            <p className="mb-4 text-sm text-white/50">
              Generate a code, then enter it on your other device within 10 minutes.
            </p>
            {code ? (
              <div
                className="mb-4 rounded-[10px] border border-dashed py-4"
                style={{ borderColor: "rgba(147,197,253,0.5)", background: "rgba(147,197,253,0.08)" }}
              >
                <span
                  className="font-mono text-3xl font-semibold tracking-[0.3em] text-white"
                  style={{ textShadow: `0 0 16px ${GLOW}` }}
                >
                  {code}
                </span>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={status === "loading"}
                className="mb-4 w-full rounded-[10px] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: ACCENT, color: "#0A0E1A", boxShadow: `0 0 16px ${GLOW}` }}
              >
                {status === "loading" ? "Generating…" : "Generate code"}
              </button>
            )}
            {status === "error" && <p className="text-xs text-rose-400">{errorMsg}</p>}
          </div>
        )}

        {tab === "enter" && (
          <div>
            <p className="mb-4 text-sm text-white/50">
              Enter the 6-digit code shown on your primary device. This will link this device to
              that dataset.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={entered}
              onChange={(e) => setEntered(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="glass-input mb-3 py-3 text-2xl tracking-[0.4em]"
              style={{ ["--accent" as any]: ACCENT, ["--glow" as any]: GLOW }}
            />
            <button
              onClick={handleRedeem}
              disabled={entered.length !== 6 || status === "loading"}
              className="w-full rounded-[10px] py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: ACCENT, color: "#0A0E1A", boxShadow: `0 0 16px ${GLOW}` }}
            >
              {status === "loading"
                ? "Syncing…"
                : status === "success"
                ? "Synced ✓"
                : "Sync this device"}
            </button>
            {status === "error" && <p className="mt-2 text-xs text-rose-400">{errorMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
