"use client";

import { useMemo, useState } from "react";
import { Subject, Marks } from "@/types";
import { scaleEndSem, MAX } from "@/lib/grading";
import { getSubjectColor } from "@/lib/subjectColors";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Tooltip, BarChart, Bar, XAxis, YAxis, Cell, ReferenceLine,
} from "recharts";

interface AnalyticsModalProps {
  subjects: Subject[];
  marks: Record<string, Partial<Marks>>;
  onClose: () => void;
}

type CompKey = "cia1" | "cia2" | "class_participation" | "cia3" | "end_sem";
type ViewKey = "table" | "bar" | "radar";

const COMPS: { key: CompKey; label: string; shortLabel: string; max: number; color: string }[] = [
  { key: "cia1",                label: "CIA 1",      shortLabel: "CIA1", max: MAX.cia1,                color: "#A78BFA" },
  { key: "cia2",                label: "CIA 2",      shortLabel: "CIA2", max: MAX.cia2,                color: "#34D399" },
  { key: "class_participation", label: "Class Part", shortLabel: "CP",   max: MAX.class_participation, color: "#FBBF24" },
  { key: "cia3",                label: "CIA 3",      shortLabel: "CIA3", max: MAX.cia3,                color: "#F87171" },
  { key: "end_sem",             label: "End Sem",    shortLabel: "END",  max: MAX.end_sem_scaled,      color: "#FB923C" },
];

const STACK_KEYS = [
  { key: "cia1", label: "CIA1", color: "#A78BFA" },
  { key: "cia2", label: "CIA2", color: "#34D399" },
  { key: "cp",   label: "CP",   color: "#FBBF24" },
  { key: "cia3", label: "CIA3", color: "#F87171" },
  { key: "end",  label: "END",  color: "#FB923C" },
];

function getRaw(m: Partial<Marks>, key: CompKey): number | null {
  if (key === "cia1") return m.cia1 ?? null;
  if (key === "cia2") return m.cia2 ?? null;
  if (key === "class_participation") return m.class_participation ?? null;
  if (key === "cia3") return m.cia3 ?? null;
  if (key === "end_sem") return m.end_sem != null ? scaleEndSem(m.end_sem) : null;
  return null;
}

function fmt(n: number | null | undefined, d = 1): string {
  if (n == null) return "—";
  return n % 1 === 0 ? String(n) : n.toFixed(d);
}

const MultiBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontFamily: "monospace", fontSize: 12, minWidth: 130 }}>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 2 }}>
          <span style={{ color: p.fill, opacity: 0.9 }}>{p.name}</span>
          <span style={{ color: "#fff", fontWeight: 700 }}>{p.value != null ? fmt(p.value) : "—"}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsModal({ subjects, marks, onClose }: AnalyticsModalProps) {
  const [selected, setSelected] = useState<CompKey[]>([]);
  const [view, setView] = useState<ViewKey>("table");

  const toggleComp = (key: CompKey) =>
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const activeComps = COMPS.filter(c => selected.includes(c.key));
  const isOverview  = selected.length === 0;
  const isSingle    = activeComps.length === 1;
  const singleComp  = isSingle ? activeComps[0] : null;
  const accentColor = activeComps[0]?.color ?? "#93C5FD";

  const headerSub = isOverview
    ? "Grand total across all components"
    : isSingle
      ? `${activeComps[0].label} · out of ${activeComps[0].max} marks`
      : `${activeComps.map(c => c.shortLabel).join(" + ")} · multi-component`;

  // Data
  const overviewData = useMemo(() => subjects.map(s => {
    const m = marks[s.code] ?? {};
    const total = (m.cia1 ?? 0) + (m.cia2 ?? 0) + (m.class_participation ?? 0) + (m.cia3 ?? 0) + scaleEndSem(m.end_sem ?? null);
    return { subject: s.short_name, full_name: s.full_name, percentage: Number(total.toFixed(1)), color: getSubjectColor(s.code).accent };
  }), [subjects, marks]);

  const stackedData = useMemo(() => subjects.map(s => {
    const m = marks[s.code] ?? {};
    return { subject: s.short_name, cia1: m.cia1 ?? 0, cia2: m.cia2 ?? 0, cp: m.class_participation ?? 0, cia3: m.cia3 ?? 0, end: scaleEndSem(m.end_sem ?? null) };
  }), [subjects, marks]);

  const multiData = useMemo(() => subjects.map(s => {
    const m = marks[s.code] ?? {};
    const row: Record<string, any> = { subject: s.short_name, full_name: s.full_name, code: s.code, color: getSubjectColor(s.code).accent };
    for (const c of activeComps) row[c.key] = getRaw(m, c.key);
    return row;
  }), [subjects, marks, selected]);

  const compAvgs = useMemo(() => activeComps.map(c => {
    const entered = multiData.filter(d => d[c.key] != null);
    return { key: c.key, avg: entered.length ? entered.reduce((a, d) => a + d[c.key], 0) / entered.length : null, notEntered: multiData.length - entered.length };
  }), [multiData, activeComps]);

  const singleStats = useMemo(() => {
    if (!singleComp || !compAvgs[0]?.avg) return null;
    const avg = compAvgs[0].avg!;
    const entered = multiData.filter(d => d[singleComp.key] != null);
    if (!entered.length) return null;
    const best  = entered.reduce((a, b) => (a[singleComp.key] ?? 0) >= (b[singleComp.key] ?? 0) ? a : b);
    const worst = entered.reduce((a, b) => (a[singleComp.key] ?? 0) <= (b[singleComp.key] ?? 0) ? a : b);
    return { avg, best: best.subject, worst: worst.subject, bestFull: best.full_name, worstFull: worst.full_name, max: singleComp.max, notEntered: compAvgs[0].notEntered };
  }, [singleComp, multiData, compAvgs]);

  const overviewStats = useMemo(() => {
    const e = overviewData.filter(d => d.percentage > 0);
    if (!e.length) return null;
    const avg = e.reduce((a, d) => a + d.percentage, 0) / e.length;
    const best  = e.reduce((a, b) => a.percentage >= b.percentage ? a : b);
    const worst = e.reduce((a, b) => a.percentage <= b.percentage ? a : b);
    return { avg, best: best.subject, worst: worst.subject, bestFull: best.full_name, worstFull: worst.full_name };
  }, [overviewData]);

  const statsObj = isOverview ? overviewStats : (isSingle ? singleStats : null);
  const statColor = isOverview ? "#93C5FD" : (singleComp?.color ?? accentColor);

  // View tabs available per mode
  const viewTabs: { key: ViewKey; icon: string; label: string }[] = isOverview
    ? [{ key: "table", icon: "☰", label: "Table" }, { key: "bar", icon: "▦", label: "Bar" }, { key: "radar", icon: "◎", label: "Radar" }]
    : [{ key: "table", icon: "☰", label: "Table" }, { key: "bar", icon: "▦", label: "Bar" }];

  // Reset to table if radar not available in comp mode
  const activeView: ViewKey = (!isOverview && view === "radar") ? "table" : view;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="glass-card relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh", "--accent": accentColor, "--glow": `${accentColor}66` } as any}
      >
        {/* Header */}
        <div className="border-b border-white/[0.07] px-5 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-serif text-base font-bold text-white">Performance Analytics</h2>
            <p className="text-[10px] text-white/35 mt-0.5">{headerSub}</p>
          </div>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* ── ROW 1: Component pills ── */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold mb-2">Component</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                onClick={() => setSelected([])}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono border transition-all ${isOverview ? "border-transparent text-black scale-105" : "bg-white/[0.03] border-white/10 text-white/50 hover:text-white/80"}`}
                style={isOverview ? { backgroundColor: "#93C5FD", boxShadow: "0 0 10px #93C5FD55" } : {}}
              >ALL</button>
              <span className="text-white/15 text-[10px] select-none">|</span>
              {COMPS.map(c => {
                const active = selected.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => toggleComp(c.key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono border transition-all ${active ? "border-transparent text-black scale-105" : "bg-white/[0.03] border-white/10 text-white/50 hover:text-white/80"}`}
                    style={active ? { backgroundColor: c.color, boxShadow: `0 0 10px ${c.color}55` } : {}}
                  >{c.shortLabel}</button>
                );
              })}
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-[9px] text-white/25 hover:text-white/50 font-mono ml-1 transition-colors">clear</button>
              )}
            </div>
          </div>

          {/* ── ROW 2: View switcher ── */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold mb-2">View</p>
            <div className="flex gap-1.5">
              {viewTabs.map(vt => (
                <button
                  key={vt.key}
                  onClick={() => setView(vt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-mono border transition-all ${
                    activeView === vt.key
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/[0.07] bg-white/[0.02] text-white/40 hover:text-white/70 hover:border-white/15"
                  }`}
                >
                  <span className="text-[10px] opacity-70">{vt.icon}</span>
                  {vt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Stat cards (always shown) ── */}
          {statsObj && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-center">
                <span className="block text-[9px] uppercase tracking-wider mb-1" style={{ color: statColor }}>
                  {isOverview ? "Avg Total" : "Average"}
                </span>
                <span className="font-mono text-lg font-bold text-white">{fmt(statsObj.avg)}</span>
                <span className="text-[10px] text-white/35 ml-1">{isOverview ? "/100" : `/${(statsObj as any).max ?? ""}`}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-center">
                <span className="block text-[9px] uppercase tracking-wider text-emerald-400/70 mb-1">Highest</span>
                <span className="font-mono text-xs font-bold text-white block">{statsObj.best}</span>
                <span className="text-[9px] text-white/25 block truncate">{statsObj.bestFull}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-center">
                <span className="block text-[9px] uppercase tracking-wider text-rose-400/70 mb-1">Lowest</span>
                <span className="font-mono text-xs font-bold text-white block">{statsObj.worst}</span>
                <span className="text-[9px] text-white/25 block truncate">{statsObj.worstFull}</span>
              </div>
            </div>
          )}
          {/* Multi-comp avg cards */}
          {!isOverview && !isSingle && (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${activeComps.length}, 1fr)` }}>
              {activeComps.map((c, i) => (
                <div key={c.key} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-center">
                  <span className="block text-[9px] uppercase tracking-wider mb-1 font-semibold" style={{ color: c.color }}>{c.shortLabel} avg</span>
                  <span className="font-mono text-base font-bold text-white">{fmt(compAvgs[i]?.avg)}</span>
                  <span className="text-[10px] text-white/30 ml-1">/{c.max}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ledger-rule" />

          {/* ── TABLE VIEW ── */}
          {activeView === "table" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">
                  {isOverview ? "Grand Total per Subject" : `Marks — ${activeComps.map(c => c.shortLabel).join(" · ")}`}
                </p>
                {isSingle && singleStats && singleStats.notEntered > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 font-mono">{singleStats.notEntered} not entered</span>
                )}
              </div>
              <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.07]">
                      <th className="text-left px-3 py-2 text-white/25 font-semibold uppercase tracking-wider text-[9px]">Subject</th>
                      {isOverview ? (
                        <>
                          <th className="text-right px-3 py-2 text-white/25 font-semibold uppercase tracking-wider text-[9px]">Total</th>
                          <th className="px-3 py-2 w-20"></th>
                          <th className="text-right px-3 py-2 text-white/25 font-semibold uppercase tracking-wider text-[9px]">vs avg</th>
                        </>
                      ) : (
                        <>
                          {activeComps.map(c => (
                            <th key={c.key} className="text-right px-2 py-2 text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: c.color }}>
                              {c.shortLabel}<span className="text-white/20 normal-case font-normal">/{c.max}</span>
                            </th>
                          ))}
                          {isSingle && <th className="px-3 py-2 w-16"></th>}
                          {isSingle && <th className="text-right px-3 py-2 text-white/25 text-[9px] font-semibold uppercase tracking-wider">vs avg</th>}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {isOverview ? (
                      overviewData.map(d => {
                        const pct = (d.percentage / 100) * 100;
                        const delta = overviewStats ? d.percentage - overviewStats.avg : null;
                        const isBest  = overviewStats && d.subject === overviewStats.best;
                        const isWorst = overviewStats && d.subject === overviewStats.worst;
                        return (
                          <tr key={d.subject} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="text-white/70">{d.subject}</span>
                                {isBest  && <span className="text-[8px] px-1 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">top</span>}
                                {isWorst && <span className="text-[8px] px-1 py-0.5 rounded-full bg-rose-400/10 text-rose-400">low</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right font-bold">
                              <span style={{ color: "#93C5FD" }}>{fmt(d.percentage)}</span><span className="text-white/25">/100</span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: "#93C5FD", opacity: 0.65 }} />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right" style={{ color: delta == null ? "rgba(255,255,255,0.2)" : delta > 0 ? "#34D399" : delta < 0 ? "#F87171" : "rgba(255,255,255,0.4)" }}>
                              {delta == null ? "—" : delta === 0 ? "avg" : `${delta > 0 ? "+" : ""}${fmt(delta)}`}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      multiData.map(d => {
                        const isBest  = isSingle && singleStats && d.subject === singleStats.best;
                        const isWorst = isSingle && singleStats && d.subject === singleStats.worst;
                        const sScore  = singleComp ? d[singleComp.key] : null;
                        const pct     = singleComp && sScore != null ? (sScore / singleComp.max) * 100 : null;
                        const delta   = isSingle && singleStats && sScore != null ? sScore - singleStats.avg : null;
                        return (
                          <tr key={d.code} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="text-white/70">{d.subject}</span>
                                {isBest  && <span className="text-[8px] px-1 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">top</span>}
                                {isWorst && <span className="text-[8px] px-1 py-0.5 rounded-full bg-rose-400/10 text-rose-400">low</span>}
                              </div>
                            </td>
                            {activeComps.map(c => (
                              <td key={c.key} className="px-2 py-2 text-right font-bold">
                                {d[c.key] != null ? <span style={{ color: c.color }}>{fmt(d[c.key])}</span> : <span className="text-white/20">—</span>}
                              </td>
                            ))}
                            {isSingle && (
                              <td className="px-3 py-2">
                                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                  {pct != null && <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: singleComp!.color, opacity: 0.7 }} />}
                                </div>
                              </td>
                            )}
                            {isSingle && (
                              <td className="px-3 py-2 text-right" style={{ color: delta == null ? "rgba(255,255,255,0.2)" : delta > 0 ? "#34D399" : delta < 0 ? "#F87171" : "rgba(255,255,255,0.4)" }}>
                                {delta == null ? "—" : delta === 0 ? "avg" : `${delta > 0 ? "+" : ""}${fmt(delta)}`}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.02]">
                      <td className="px-3 py-2 text-white/35 uppercase text-[9px] tracking-wider">Class Avg</td>
                      {isOverview ? (
                        <>
                          <td className="px-3 py-2 text-right font-bold" style={{ color: "#93C5FD" }}>
                            {fmt(overviewStats?.avg)}<span className="text-white/25">/100</span>
                          </td>
                          <td className="px-3 py-2">
                            {overviewStats && (
                              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(overviewStats.avg, 100)}%`, backgroundColor: "#93C5FD", opacity: 0.35 }} />
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-white/30 text-[9px]">{overviewStats ? `${fmt(overviewStats.avg)}%` : "—"}</td>
                        </>
                      ) : (
                        <>
                          {activeComps.map((c, i) => (
                            <td key={c.key} className="px-2 py-2 text-right font-bold" style={{ color: c.color }}>{fmt(compAvgs[i]?.avg)}</td>
                          ))}
                          {isSingle && (
                            <td className="px-3 py-2">
                              {singleStats && (
                                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min((singleStats.avg / singleStats.max) * 100, 100)}%`, backgroundColor: singleComp!.color, opacity: 0.4 }} />
                                </div>
                              )}
                            </td>
                          )}
                          {isSingle && <td className="px-3 py-2 text-right text-white/30 text-[9px]">{singleStats ? `${((singleStats.avg / singleStats.max) * 100).toFixed(1)}%` : "—"}</td>}
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── BAR VIEW ── */}
          {activeView === "bar" && (
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold mb-3">
                {isOverview ? "Component Breakdown per Subject" : `${isSingle ? singleComp!.label : activeComps.map(c => c.shortLabel).join(" & ")} per Subject`}
              </p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {isOverview ? (
                    <BarChart data={stackedData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }} barCategoryGap="25%">
                      <XAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "monospace", fontSize: 11 }} labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: 600 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      {STACK_KEYS.map(sk => (
                        <Bar key={sk.key} dataKey={sk.key} name={sk.label} stackId="a" fill={sk.color} fillOpacity={0.8} radius={sk.key === "end" ? [3, 3, 0, 0] : undefined} maxBarSize={36} />
                      ))}
                    </BarChart>
                  ) : (
                    <BarChart data={multiData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }} barCategoryGap={isSingle ? "30%" : "20%"} barGap={2}>
                      <XAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, isSingle ? singleComp!.max : Math.max(...activeComps.map(c => c.max))]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      {isSingle && singleStats && (
                        <ReferenceLine y={singleStats.avg} stroke={singleComp!.color} strokeDasharray="4 3" strokeOpacity={0.7} label={{ value: `avg ${fmt(singleStats.avg)}`, position: "insideTopRight", fill: singleComp!.color, fontSize: 9, fontFamily: "monospace" }} />
                      )}
                      <Tooltip content={<MultiBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      {isSingle ? (
                        <Bar dataKey={singleComp!.key} name={singleComp!.label} radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {multiData.map(d => <Cell key={d.code} fill={singleComp!.color} fillOpacity={d[singleComp!.key] == null ? 0.15 : 0.75} />)}
                        </Bar>
                      ) : activeComps.map(c => (
                        <Bar key={c.key} dataKey={c.key} name={c.label} fill={c.color} fillOpacity={0.75} radius={[3, 3, 0, 0]} maxBarSize={22} />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {(isOverview ? STACK_KEYS : activeComps.map(c => ({ key: c.key, label: c.shortLabel, color: c.color }))).map(item => (
                  <div key={item.key} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-white/35 font-mono">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RADAR VIEW (overview only) ── */}
          {activeView === "radar" && isOverview && (
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold mb-3">Radar — Grand Total per Subject</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="72%" data={overviewData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10, fontFamily: "monospace" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Total" dataKey="percentage" stroke="#93C5FD" strokeWidth={2} fill="#93C5FD" fillOpacity={0.15} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "monospace", fontSize: 12 }} itemStyle={{ color: "#93C5FD" }} labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }} formatter={(v: any) => [`${v}/100`, "Grand Total"]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
