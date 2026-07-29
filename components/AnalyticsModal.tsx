"use client";

import { useMemo } from "react";
import { Subject, Marks } from "@/types";
import { computeGrade } from "@/lib/grading";
import { getSubjectColor } from "@/lib/subjectColors";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

interface AnalyticsModalProps {
  subjects: Subject[];
  marks: Record<string, Partial<Marks>>;
  onClose: () => void;
}

export default function AnalyticsModal({ subjects, marks, onClose }: AnalyticsModalProps) {
  const { data, strongest, weakest } = useMemo(() => {
    let strongestSub: Subject | null = null;
    let weakestSub: Subject | null = null;
    let max = -1;
    let min = 101;

    const chartData = subjects.map((s) => {
      const grade = computeGrade(marks[s.code] ?? {});
      const color = getSubjectColor(s.code);
      
      if (grade.percentage > max) {
        max = grade.percentage;
        strongestSub = s;
      }
      
      if (grade.percentage < min) {
        min = grade.percentage;
        weakestSub = s;
      }

      return {
        subject: s.short_name,
        full_name: s.full_name,
        percentage: Number(grade.percentage.toFixed(1)),
        color: color.accent,
      };
    });

    return { data: chartData, strongest: strongestSub, weakest: weakestSub };
  }, [subjects, marks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="glass-card relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl" style={{ "--accent": "#93C5FD", "--glow": "rgba(147,197,253,0.4)" } as any}>
        <div className="border-b border-white/[0.07] px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-white">Performance Analytics</h2>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {data.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "monospace" }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={false} 
                    axisLine={false}
                  />
                  <Radar
                    name="Score"
                    dataKey="percentage"
                    stroke="#93C5FD"
                    strokeWidth={2}
                    fill="#93C5FD"
                    fillOpacity={0.2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15, 23, 42, 0.9)", 
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      fontFamily: "monospace"
                    }}
                    itemStyle={{ color: "#93C5FD" }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-white/40">
              No data available
            </div>
          )}

          <div className="ledger-rule mt-6 mb-5" />

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-emerald-400/80 mb-2">Strongest</span>
              <span className="font-mono text-sm font-semibold text-white truncate block">
                {strongest?.short_name || "—"}
              </span>
              <span className="text-xs text-white/40 truncate block mt-1">
                {strongest?.full_name || "—"}
              </span>
            </div>
            
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-rose-400/80 mb-2">Needs Focus</span>
              <span className="font-mono text-sm font-semibold text-white truncate block">
                {weakest?.short_name || "—"}
              </span>
              <span className="text-xs text-white/40 truncate block mt-1">
                {weakest?.full_name || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
