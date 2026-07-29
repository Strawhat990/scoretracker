"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ProfileModalProps {
  profileId: string;
  defaultName?: string;
  defaultRegNo?: string;
  onClose: () => void;
  onSaved: (name: string, regNo: string) => void;
}

const ACCENT = "#93C5FD";
const GLOW = "rgba(147,197,253,0.5)";

export default function ProfileModal({
  profileId,
  defaultName = "",
  defaultRegNo = "",
  onClose,
  onSaved,
}: ProfileModalProps) {
  const [name, setName] = useState(defaultName);
  const [regNo, setRegNo] = useState(defaultRegNo);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSave() {
    setStatus("loading");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name, reg_no: regNo })
        .eq("id", profileId);

      if (error) throw error;

      setStatus("success");
      setTimeout(() => {
        onSaved(name, regNo);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Couldn't save details. Try again.");
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
          <h2 className="font-serif text-lg font-semibold text-white">Your Details</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-white/50">
          Add your name and registration number. This will sync across your devices.
        </p>

        <label className="block mb-3">
          <span className="mb-1 block text-[11px] font-medium text-white/40">Name</span>
          <input
            type="text"
            className="glass-input py-2"
            style={{ ["--accent" as any]: ACCENT, ["--glow" as any]: GLOW }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </label>

        <label className="block mb-5">
          <span className="mb-1 block text-[11px] font-medium text-white/40">Registration No.</span>
          <input
            type="text"
            className="glass-input py-2"
            style={{ ["--accent" as any]: ACCENT, ["--glow" as any]: GLOW }}
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            placeholder="e.g. 23MBA001"
          />
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[10px] py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={status === "loading" || (!name && !regNo)}
            className="flex-1 rounded-[10px] py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: ACCENT, color: "#0A0E1A", boxShadow: `0 0 16px ${GLOW}` }}
          >
            {status === "loading" ? "Saving…" : status === "success" ? "Saved ✓" : "Save"}
          </button>
        </div>
        {status === "error" && <p className="mt-2 text-xs text-rose-400">{errorMsg}</p>}
      </div>
    </div>
  );
}
