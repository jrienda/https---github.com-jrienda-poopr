"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PoopEntry = {
  id: string;
  whenIso: string;
  bristolType: "separated" | "hard" | "normal" | "soft" | "mushy" | "liquid";
  hadBlood: boolean;
  loadSize: "little" | "normal" | "big";
};

const STORAGE_KEY = "poop-entries";

function readEntries(): PoopEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function toKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getPoopValue(entry: PoopEntry): number {
  switch (entry.loadSize) {
    case "little": return 0.5;
    case "normal": return 1;
    case "big": return 2;
    default: return 1;
  }
}

function HistogramPage() {
  const [entries, setEntries] = useState<PoopEntry[]>([]);

  useEffect(() => {
    setEntries(readEntries());
  }, []);

  // Get last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  // Calculate daily totals
  const dailyData = last7Days.map(date => {
    const dayKey = toKey(date);
    const dayEntries = entries.filter(e => toKey(new Date(e.whenIso)) === dayKey);
    const totalValue = dayEntries.reduce((sum, entry) => sum + getPoopValue(entry), 0);
    
    return {
      date,
      dayKey,
      totalValue,
      entryCount: dayEntries.length
    };
  });

  const maxValue = Math.max(...dailyData.map(d => d.totalValue), 1);

  return (
    <main className="container">
      <div className="phone stack" style={{ gap: 12 }}>
        <header className="stack" style={{ gap: 8 }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between"
          }}>
            <Link 
              href="/" 
              style={{ 
                textDecoration: "none", 
                color: "var(--poop)",
                fontSize: "18px",
                fontWeight: "600"
              }}
            >
              ← Back
            </Link>
          </div>
          <h2 className="title" style={{ margin: 0, textAlign: "center" }}>Weekly Overview</h2>
        </header>

        {/* Histogram */}
        <div className="card">
          <div style={{ 
            display: "flex", 
            alignItems: "end", 
            justifyContent: "space-between",
            height: "200px",
            borderBottom: "2px solid var(--poop)",
            borderLeft: "2px solid var(--poop)",
            padding: "0 8px 8px 8px"
          }}>
            {dailyData.map((day, index) => {
              const height = maxValue > 0 ? (day.totalValue / maxValue) * 180 : 0;
              
              return (
                <div key={day.dayKey} style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center",
                  width: "40px"
                }}>
                  {/* Bar */}
                  <div style={{
                    width: "24px",
                    height: `${height}px`,
                    background: day.totalValue > 0 ? "var(--poop)" : "#e5e5e5",
                    borderRadius: "4px 4px 0 0",
                    marginBottom: "8px",
                    transition: "all 0.3s ease"
                  }} />
                  
                  {/* Day label */}
                  <div style={{ 
                    fontSize: "12px", 
                    color: "var(--muted)",
                    textAlign: "center",
                    fontWeight: "500"
                  }}>
                    {day.date.toLocaleDateString('en-US', { 
                      weekday: 'short' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export default HistogramPage;
