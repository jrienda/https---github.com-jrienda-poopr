"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Keep this in sync with main app's storage shape
type PoopEntry = {
  id: string;
  timestampIso: string; // ISO string
  bristolType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hadBlood: boolean;
  loadSize?: "little" | "normal" | "big";
};

// Use the same storage key used by the main app
const STORAGE_KEY = "poopr.entries.v1";

function readEntries(): PoopEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function toKey(d: Date) {
  return startOfDay(d).toISOString();
}

function getPoopValue(entry: PoopEntry): number {
  switch (entry.loadSize) {
    case "little": return 0.5;
    case "normal": return 1;
    case "big": return 2;
    default: return 1; // default if undefined
  }
}

function HistogramPage() {
  const [entries, setEntries] = useState<PoopEntry[]>([]);
  const [fact, setFact] = useState<string>("");
  const [loadingFact, setLoadingFact] = useState<boolean>(false);

  useEffect(() => {
    setEntries(readEntries());
  }, []);

  async function fetchFact() {
    try {
      setLoadingFact(true);
      setFact("");
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a witty health assistant. Reply with a single short fun fact or evidence-based nugget about bowel movements, stool, gut, or pooping. Keep it under 200 characters. No emojis.",
            },
            {
              role: "user",
              content: "Give me a fun fact or scientific data about pooping.",
            },
          ],
        }),
      });
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content ?? json?.content ?? "";
      setFact(String(text || "Couldn’t fetch a fact right now."));
    } catch {
      setFact("Couldn’t fetch a fact right now.");
    } finally {
      setLoadingFact(false);
    }
  }

  // Get last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  // Calculate daily totals
  const dailyData = last7Days.map(date => {
    const dayKey = toKey(date);
    const dayEntries = entries.filter(e => {
      const dt = new Date(e.timestampIso);
      return toKey(dt) === dayKey;
    });
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
                  {/* Value icons (no numbers) */}
                  <div style={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "center", marginBottom: 6, minHeight: 14 }}>
                    {(function(){
                      const icons: JSX.Element[] = [];
                      const maxIcons = 6;
                      const full = Math.floor(day.totalValue);
                      const hasHalf = day.totalValue - full >= 0.5;
                      const totalIcons = Math.min(full + (hasHalf ? 1 : 0), maxIcons);
                      for (let i = 0; i < totalIcons; i++) {
                        const isHalf = i === full && hasHalf;
                        const fill = isHalf ? "#bfa999" : "var(--poop)";
                        icons.push(
                          <svg key={i} width={12} height={12} viewBox="0 0 512 512" fill={fill} aria-hidden>
                            <path d="M451.36 369.14C468.66 355.99 480 335.41 480 312c0-39.77-32.24-72-72-72h-14.07c13.42-11.73 22.07-28.78 22.07-48 0-35.35-28.65-64-64-64h-5.88c3.57-10.05 5.88-20.72 5.88-32 0-53.02-42.98-96-96-96-5.17 0-10.15.74-15.11 1.52C250.31 14.64 256 30.62 256 48c0 44.18-35.82 80-80 80h-16c-35.35 0-64 28.65-64 64 0 19.22 8.65 36.27 22.07 48H104c-39.76 0-72 32.23-72 72 0 23.41 11.34 43.99 28.64 57.14C26.31 374.62 0 404.12 0 440c0 39.76 32.24 72 72 72h368c39.76 0 72-32.24 72-72 0-35.88-26.31-65.38-60.64-70.86z"/>
                          </svg>
                        );
                      }
                      return icons;
                    })()}
                  </div>
                  {/* Bar */}
                  <div style={{
                    width: "24px",
                    height: `${height}px`,
                    background: day.totalValue > 0 ? "var(--poop)" : "#e5e5e5",
                    borderRadius: "4px 4px 0 0",
                    marginBottom: "8px",
                    transition: "all 0.3s ease"
                  }} />
                </div>
              );
            })}
          </div>
        </div>
        {/* Fun fact card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, color: "var(--poop)" }}>Poop Fact</div>
            <button onClick={fetchFact} style={{
              background: "transparent",
              border: "1px solid var(--ring)",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              color: "var(--poop)",
            }}>
              {loadingFact ? "Loading…" : "New fact"}
            </button>
          </div>
          <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
            {fact || "Tap “New fact” to fetch a funny fact or scientific nugget about pooping."}
          </div>
        </div>
      </div>
    </main>
  );
}

export default HistogramPage;
