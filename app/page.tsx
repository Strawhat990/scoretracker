"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureDevice } from "@/lib/device";
import { Subject, Marks, EMPTY_MARKS } from "@/types";
import { computeGrade } from "@/lib/grading";
import SubjectCard from "@/components/SubjectCard";
import SyncModal from "@/components/SyncModal";
import ProfileModal from "@/components/ProfileModal";
import AnalyticsModal from "@/components/AnalyticsModal";

type MarksMap = Record<string, Partial<Marks>>;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<MarksMap>({});
  const [syncOpen, setSyncOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileRegNo, setProfileRegNo] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const marksRef = useRef<MarksMap>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  async function loadAll(pid: string) {
    const [
      { data: subjectRows },
      { data: markRows },
      { data: profileRow }
    ] = await Promise.all([
      supabase.from("subjects").select("*").order("sort_order"),
      supabase.from("marks").select("*").eq("profile_id", pid),
      supabase.from("profiles").select("name, reg_no").eq("id", pid).single(),
    ]);

    setSubjects((subjectRows as Subject[]) ?? []);

    if (profileRow) {
      setProfileName(profileRow.name);
      setProfileRegNo(profileRow.reg_no);
      if (!profileRow.name && !profileRow.reg_no) {
        setProfileModalOpen(true);
      }
    }

    const map: MarksMap = {};
    (subjectRows as Subject[] | null)?.forEach((s) => {
      map[s.code] = { ...EMPTY_MARKS };
    });
    (markRows as Marks[] | null)?.forEach((m) => {
      map[m.subject_code] = m;
    });
    setMarks(map);
    marksRef.current = map;
  }

  useEffect(() => {
    (async () => {
      try {
        const { deviceId, profileId } = await ensureDevice();
        setDeviceId(deviceId);
        setProfileId(profileId);
        await loadAll(profileId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleChange(subjectCode: string, field: keyof Marks, value: number | null) {
    if (!profileId) return;

    setMarks((prev) => {
      const newMap = {
        ...prev,
        [subjectCode]: { ...prev[subjectCode], [field]: value },
      };
      marksRef.current = newMap;
      return newMap;
    });

    // Debounced autosave per subject — avoids a network round-trip on
    // every keystroke while still saving promptly once typing pauses.
    clearTimeout(saveTimers.current[subjectCode]);
    setSaveState("saving");
    saveTimers.current[subjectCode] = setTimeout(async () => {
      const current = marksRef.current[subjectCode];
      if (!current) return;
      await supabase.from("marks").upsert({
        profile_id: profileId,
        subject_code: subjectCode,
        cia1: current.cia1 ?? null,
        cia2: current.cia2 ?? null,
        class_participation: current.class_participation ?? null,
        mcq1: current.mcq1 ?? null,
        mcq2: current.mcq2 ?? null,
        mcq3: current.mcq3 ?? null,
        mcq4: current.mcq4 ?? null,
        mcq5: current.mcq5 ?? null,
        cia3: current.cia3 ?? null,
        end_sem: current.end_sem ?? null,
        updated_at: new Date().toISOString(),
      });
      setSaveState("saved");
    }, 600);
  }

  const overall = useMemo(() => {
    const totals = subjects.map((s) => computeGrade(marks[s.code] ?? {}));
    if (totals.length === 0) return 0;
    const sum = totals.reduce((acc, t) => acc + t.grandTotal, 0);
    return sum / totals.length;
  }, [subjects, marks]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-white/40">Loading your marksheet…</p>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-white/40">
            Trimester 1
          </p>
          <div className="flex items-center gap-3">
            <h1
              className="font-serif text-[26px] font-bold leading-tight text-white sm:text-3xl"
              style={{ textShadow: "0 0 30px rgba(147,197,253,0.25)" }}
            >
              Grade Tracker
            </h1>
            <button
              onClick={() => setProfileModalOpen(true)}
              className="mt-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              {profileName || profileRegNo ? (
                <>
                  {profileName} {profileRegNo && `(${profileRegNo})`}
                </>
              ) : (
                "+ Add Details"
              )}
            </button>
          </div>
          <p className="mt-1 text-sm text-white/50">
            Average across {subjects.length} subjects:{" "}
            <span className="font-mono font-semibold text-white">{overall.toFixed(1)}</span>
            <span className="text-white/40">/100</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <button
            onClick={() => setAnalyticsOpen(true)}
            className="glass-card flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-medium text-white/80 hover:text-white"
            style={{ ["--accent" as any]: "#10B981", ["--glow" as any]: "rgba(16,185,129,0.4)" }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </button>
          <button
            onClick={() => setSyncOpen(true)}
            className="glass-card flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-medium text-white/80 hover:text-white"
            style={{ ["--accent" as any]: "#93C5FD", ["--glow" as any]: "rgba(147,197,253,0.4)" }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync device
          </button>
        </div>
      </header>

      {/* Ruled divider under header, like the top rule of a mark sheet */}
      <div className="ledger-rule mb-6" />

      {/* Subject cards */}
      <div className="space-y-3">
        {subjects.map((s, i) => (
          <SubjectCard
            key={s.code}
            subject={s}
            marks={marks[s.code] ?? {}}
            onChange={(field, value) => handleChange(s.code, field, value)}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      {/* Save status, unobtrusive */}
      <div className="mt-6 text-center">
        <span className="font-mono text-[11px] text-white/30">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "All changes saved"}
          {saveState === "idle" && "Marks sync automatically across devices"}
        </span>
      </div>

      {syncOpen && deviceId && profileId && (
        <SyncModal
          deviceId={deviceId}
          profileId={profileId}
          onClose={() => setSyncOpen(false)}
          onSynced={() => {
            // The device now points at a different profile_id in
            // Supabase/localStorage — simplest correct way to pick
            // that up everywhere in the app is a fresh load.
            window.location.reload();
          }}
        />
      )}

      {profileModalOpen && profileId && (
        <ProfileModal
          profileId={profileId}
          defaultName={profileName || ""}
          defaultRegNo={profileRegNo || ""}
          onClose={() => setProfileModalOpen(false)}
          onSaved={(name, regNo) => {
            setProfileName(name);
            setProfileRegNo(regNo);
            setProfileModalOpen(false);
          }}
        />
      )}

      {analyticsOpen && (
        <AnalyticsModal
          subjects={subjects}
          marks={marks}
          onClose={() => setAnalyticsOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 text-center pb-4">
        <p className="text-xs text-white/30 font-mono">
          Developed by Philip Samuel Rajan A Y &copy; {new Date().getFullYear()}. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
