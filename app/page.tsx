"use client";

import { useEffect, useMemo, useState } from "react";

type PoopEntry = {
  id: string;
  timestampIso: string; // ISO string
  bristolType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hadBlood: boolean;
  loadSize?: "little" | "normal" | "big";
};

const STORAGE_KEY = "poopr.entries.v1";
const STORAGE_USER = "poopr.user.name.v1";

function readEntries(): PoopEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PoopEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: PoopEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function readUserName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_USER);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

function writeUserName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_USER, name);
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function toKey(d: Date) {
  const s = startOfDay(d);
  if (isNaN(s.getTime())) return "";
  return s.toISOString();
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
}

function formatDateNum(d: Date) {
  return d.getDate();
}

function PoopIcon({ size = 24 }: { size?: number }) {
  return (
    <svg className="icon poop" width={size} height={size} viewBox="0 0 512 512" fill="currentColor">
      <path d="M451.36 369.14C468.66 355.99 480 335.41 480 312c0-39.77-32.24-72-72-72h-14.07c13.42-11.73 22.07-28.78 22.07-48 0-35.35-28.65-64-64-64h-5.88c3.57-10.05 5.88-20.72 5.88-32 0-53.02-42.98-96-96-96-5.17 0-10.15.74-15.11 1.52C250.31 14.64 256 30.62 256 48c0 44.18-35.82 80-80 80h-16c-35.35 0-64 28.65-64 64 0 19.22 8.65 36.27 22.07 48H104c-39.76 0-72 32.23-72 72 0 23.41 11.34 43.99 28.64 57.14C26.31 374.62 0 404.12 0 440c0 39.76 32.24 72 72 72h368c39.76 0 72-32.24 72-72 0-35.88-26.31-65.38-60.64-70.86z"/>
    </svg>
  );
}

function BloodIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="icon blood" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2s6 7.1 6 11.3C18 16.5 15.3 20 12 20s-6-3.5-6-6.7C6 9.1 12 2 12 2z" />
    </svg>
  );
}

function MonthCalendar({
  entries,
  year,
  month,
  onPrev,
  onNext,
  onDayClick,
  streakKeys,
  canGoNext,
  canGoPrev,
}: {
  entries: PoopEntry[];
  year: number;
  month: number; // 0-11
  onPrev: () => void;
  onNext: () => void;
  onDayClick?: (d: Date) => void;
  streakKeys?: Set<string>;
  canGoNext: boolean;
  canGoPrev: boolean;
}) {

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7; // make Monday=0
    const start = new Date(first);
    start.setDate(first.getDate() - startWeekday);
    const gridDays = 42; // 6 rows * 7 columns
    return Array.from({ length: gridDays }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  const entryKeys = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      const dt = new Date(e.timestampIso);
      if (!isNaN(dt.getTime())) {
        const k = toKey(dt);
        if (k) set.add(k);
      }
    }
    return set;
  }, [entries]);

  const monthName = new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <button aria-label="Previous month" onClick={() => { if (canGoPrev) onPrev(); }} disabled={!canGoPrev} style={{ border: "1px solid var(--ring)", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: canGoPrev ? "pointer" : "not-allowed", opacity: canGoPrev ? 1 : 0.5 }}>
          ←
        </button>
        <div style={{ fontWeight: 700 }}>{monthName}</div>
        <button aria-label="Next month" onClick={() => { if (canGoNext) onNext(); }} disabled={!canGoNext} style={{ border: "1px solid var(--ring)", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: canGoNext ? "pointer" : "not-allowed", opacity: canGoNext ? 1 : 0.5 }}>
          →
        </button>
      </div>
      <div className="month">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((w) => (
          <div key={w} className="day" aria-hidden>
            <div className="day-label">{w}</div>
          </div>
        ))}
        {days.map((d) => {
          const isCurrentMonth = d.getMonth() === month;
          const has = entryKeys.has(toKey(d));
          const k = toKey(d);
          const isFuture = +startOfDay(d) > +startOfDay(new Date());
          const inStreak = streakKeys?.has(k);
          return (
            <button
              key={d.toISOString() || Math.random()}
              className={`day${has ? " pooped" : ""}${inStreak ? " streak" : ""}`}
              aria-label={d.toDateString()}
              disabled={isFuture}
              style={{ opacity: isFuture ? 0.25 : (isCurrentMonth ? 1 : 0.4), border: "1px dashed var(--ring)", borderRadius: 10, cursor: isFuture ? "default" : "pointer" }}
              onClick={() => { if (!isFuture) onDayClick?.(d); }}
            >
              <div className="day-date">{formatDateNum(d)}</div>
              {/* dot removed; full cell color indicates entry */}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Draft = {
  whenIso: string;
  bristolType: 1 | 2 | 3 | 4 | 5 | 6 | 7; // keeping for storage compatibility; we'll map 5-option to these
  hadBlood: boolean;
  loadSize?: "little" | "normal" | "big";
};

function PoopForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Draft;
  onCancel: () => void;
  onSave: (d: Draft) => void;
}) {
  const [whenIso, setWhenIso] = useState(initial.whenIso);
  const [bristolType, setBristolType] = useState(initial.bristolType);
  const [hadBlood, setHadBlood] = useState(initial.hadBlood);
  const [loadSize, setLoadSize] = useState<"little" | "normal" | "big">(initial.loadSize ?? "normal");

  const localDateTime = useMemo(() => {
    const dt = new Date(whenIso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }, [whenIso]);

  function setFromParts(date: Date) {
    if (!isNaN(date.getTime())) setWhenIso(date.toISOString());
  }

  // Wheel data
  const wheelDays = useMemo(() => {
    const base = startOfDay(new Date());
    const arr: { label: string; date: Date }[] = [];
    for (let i = -7; i <= 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const label = i === 0
        ? "Today"
        : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      arr.push({ label, date: d });
    }
    return arr;
  }, []);

  const when = useMemo(() => new Date(whenIso), [whenIso]);

  function onWheelSelect(day: Date, hour: number, minute: number) {
    const d = new Date(day);
    d.setHours(hour, minute, 0, 0);
    setFromParts(d);
  }

  function nearestIndex(value: number, values: number[]) {
    let best = 0, bestDiff = Infinity;
    for (let i = 0; i < values.length; i++) {
      const diff = Math.abs(values[i] - value);
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    }
    return best;
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i).filter((m) => m % 5 === 0);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal style={{ zIndex: 3000 }}>
      <div className="modal stack" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>Log a poop</h3>
        {/* Date & Time removed per request; entries will use the provided timestamp */}
        <div className="stack">
          <span className="muted">How was it?</span>
          <div className="chart5">
            {[
              { key: "liquid", label: "Liquid", color: "#c28b5a", mapTo: 7 },
              { key: "mushy", label: "Mushy", color: "#a66e46", mapTo: 6 },
              { key: "soft", label: "Soft", color: "#8e5c3a", mapTo: 5 },
              { key: "normal", label: "Normal", color: "#6f4a2d", mapTo: 4 },
              { key: "hard", label: "Hard", color: "#4b2f1c", mapTo: 2 },
              { key: "lumps", label: "Separated lumps", color: "#3a2315", mapTo: 1 },
            ].map((opt, idx) => {
              const selected = bristolType === (opt.mapTo as any);
              return (
                <button
                  key={opt.key}
                  aria-pressed={selected}
                  onClick={() => setBristolType(opt.mapTo as any)}
                  style={{
                    background: selected ? opt.color : "#fff",
                    color: selected ? "#fff" : "inherit",
                    border: `3px solid ${opt.color}`,
                    gridColumn: (idx % 3) + 1,
                    gridRow: Math.floor(idx / 3) + 1,
                  }}
                >
                  <span className="chip-label">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="stack">
          <span className="muted">Any problems?</span>
          <div className="chart5" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {[{ key: "ok", label: "ALL RIGHT", color: "#555", val: false }, { key: "blood", label: "BLOOD", color: "#c1121f", val: true }].map((opt, idx) => {
              const selected = hadBlood === opt.val;
              return (
                <button
                  key={opt.key}
                  aria-pressed={selected}
                  onClick={() => setHadBlood(opt.val)}
                  style={{
                    background: selected ? opt.color : "#fff",
                    color: selected ? "#fff" : "inherit",
                    border: `3px solid ${opt.color}`,
                    gridColumn: (idx % 2) + 1,
                    gridRow: Math.floor(idx / 2) + 1,
                  }}
                >
                  <span className="chip-label">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="stack">
          <span className="muted">Was it big?</span>
          <div className="chart5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[{ key: "little", label: "LITTLE" as const }, { key: "normal", label: "NORMAL" as const }, { key: "big", label: "BIG ONE" as const }].map((opt, idx) => {
              const selected = loadSize === opt.key;
              return (
                <button
                  key={opt.key}
                  aria-pressed={selected}
                  onClick={() => setLoadSize(opt.key)}
                  style={{
                    background: selected ? "#3a3a3a" : "#fff",
                    color: selected ? "#fff" : "inherit",
                    border: `3px solid #7a7a7a`,
                    gridColumn: (idx % 3) + 1,
                    gridRow: Math.floor(idx / 3) + 1,
                  }}
                >
                  <span className="chip-label">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sheet-actions actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={() => onSave({ whenIso, bristolType, hadBlood, loadSize })}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

const HEADER_PHRASES = [
  "Did you survive that?",
  "Toilet still breathing, bro?",
  "How’s the porcelain holding?",
  "Big one or legendary?",
  "Did you break physics?",
  "Smells like victory, huh?",
  "You okay in there?",
  "Was it spiritually cleansing?",
  "Need a plumber now?",
  "Did hell just open?",
] as const;

export default function Page() {
  const [entries, setEntries] = useState<PoopEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [header, setHeader] = useState<string>("");
  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const [dayModal, setDayModal] = useState<Date | null>(null);
  const [editing, setEditing] = useState<PoopEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PoopEntry | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<string>("");
  const [prefillWhenIso, setPrefillWhenIso] = useState<string | null>(null);

  useEffect(() => {
    setEntries(readEntries());
    setUserName(readUserName());
  }, []);

  useEffect(() => {
    writeEntries(entries);
  }, [entries]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * HEADER_PHRASES.length);
    setHeader(HEADER_PHRASES[idx]);
  }, []);

  function addEntry(d: Draft) {
    const e: PoopEntry = {
      id: crypto.randomUUID(),
      timestampIso: d.whenIso,
      bristolType: d.bristolType,
      hadBlood: d.hadBlood,
    };
    setEntries((prev) => [e, ...prev].sort((a, b) => +new Date(b.timestampIso) - +new Date(a.timestampIso)));
  }

  function updateEntry(id: string, d: Draft) {
    setEntries((prev) => prev
      .map((e) => (e.id === id ? { ...e, timestampIso: d.whenIso, bristolType: d.bristolType, hadBlood: d.hadBlood } : e))
      .sort((a, b) => +new Date(b.timestampIso) - +new Date(a.timestampIso))
    );
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const nowIso = useMemo(() => new Date().toISOString(), []);

  function formatTime(d: Date) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const { currentStreak, longestStreak, currentStreakKeys } = useMemo(() => {
    const byDay = new Set<string>();
    for (const e of entries) {
      const dt = new Date(e.timestampIso);
      const k = toKey(dt);
      if (k) byDay.add(k);
    }
    const keys = Array.from(byDay).sort();
    const dates = keys.map((k) => new Date(k));
    let longest = 0;
    let current = 0;
    let currentKeys = new Set<string>();
    // compute consecutive days ending today
    const todayKey = toKey(new Date());
    let d = new Date();
    while (byDay.has(toKey(d))) {
      current += 1;
      currentKeys.add(toKey(d));
      d.setDate(d.getDate() - 1);
    }
    // longest overall
    let run = 0;
    for (let i = 0; i < dates.length; i++) {
      if (i === 0 || dates[i].getTime() - dates[i - 1].getTime() === 24 * 3600 * 1000) {
        run += 1;
      } else {
        longest = Math.max(longest, run);
        run = 1;
      }
    }
    longest = Math.max(longest, run);
    return { currentStreak: current, longestStreak: longest, currentStreakKeys: currentKeys };
  }, [entries]);

  const daysSinceLast = useMemo(() => {
    if (entries.length === 0) return null;
    let latest: Date | null = null;
    for (const e of entries) {
      const d = new Date(e.timestampIso);
      if (!isNaN(d.getTime()) && (!latest || d > latest)) latest = d;
    }
    if (!latest) return null;
    const today = startOfDay(new Date());
    const lastDay = startOfDay(latest);
    const diff = Math.floor((+today - +lastDay) / (24 * 3600 * 1000));
    return diff; // 0=today, 1=yesterday
  }, [entries]);

  function DayEntriesModal({ date, entries, onClose, onRequestDelete, onRequestEdit, onAddForDay }: {
    date: Date;
    entries: PoopEntry[];
    onClose: () => void;
    onRequestDelete: (e: PoopEntry) => void;
    onRequestEdit: (e: PoopEntry) => void;
    onAddForDay: (d: Date) => void;
  }) {
    const key = toKey(date);
    const list = useMemo(() => {
      return entries
        .filter((e) => {
          const dt = new Date(e.timestampIso);
          return toKey(dt) === key;
        })
        .sort((a, b) => +new Date(b.timestampIso) - +new Date(a.timestampIso));
    }, [entries, key]);

    const title = date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="modal-backdrop" role="dialog" aria-modal style={{ zIndex: 2500 }}>
        <div className="modal stack" style={{ gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <div className="row" style={{ gap: 8 }}>
              <button onClick={() => onAddForDay(date)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "24px", fontWeight: "300", color: "#333", padding: "8px" }}>+</button>
              <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "24px", fontWeight: "300", color: "#666", padding: "8px" }}>×</button>
            </div>
          </div>
          {list.length === 0 ? (
            <div className="muted">No entries for this day.</div>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              {list.map((e) => {
                const dt = new Date(e.timestampIso);
                return (
                  <div key={e.id} className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <div>{formatTime(dt)}</div>
                    </div>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                        {(function() {
                          const colors = {
                            1: "#3a2315", // Separated lumps - darkest brown
                            2: "#4b2f1c", // Hard - dark brown
                            3: "#6f4a2d", // Normal - medium brown
                            4: "#6f4a2d", // Normal - medium brown
                            5: "#8e5c3a", // Soft - light brown
                            6: "#a66e46", // Mushy - lighter brown
                            7: "#c28b5a"  // Liquid - lightest brown
                          };
                          const color = colors[e.bristolType as keyof typeof colors] || "#6f4a2d";
                          const loadSize = e.loadSize || "normal";
                          
                          // Handle legacy entries that might have different loadSize values
                          const normalizedLoadSize = loadSize === "little" || loadSize === "LITTLE" ? "little" :
                                                   loadSize === "big" || loadSize === "BIG ONE" ? "big" : "normal";
                          
                          if (normalizedLoadSize === "little") {
                            return (
                              <svg width={9} height={18} viewBox="0 0 512 512" fill={color} style={{ clipPath: "inset(0 50% 0 0)" }}>
                                <path d="M451.36 369.14C468.66 355.99 480 335.41 480 312c0-39.77-32.24-72-72-72h-14.07c13.42-11.73 22.07-28.78 22.07-48 0-35.35-28.65-64-64-64h-5.88c3.57-10.05 5.88-20.72 5.88-32 0-53.02-42.98-96-96-96-5.17 0-10.15.74-15.11 1.52C250.31 14.64 256 30.62 256 48c0 44.18-35.82 80-80 80h-16c-35.35 0-64 28.65-64 64 0 19.22 8.65 36.27 22.07 48H104c-39.76 0-72 32.23-72 72 0 23.41 11.34 43.99 28.64 57.14C26.31 374.62 0 404.12 0 440c0 39.76 32.24 72 72 72h368c39.76 0 72-32.24 72-72 0-35.88-26.31-65.38-60.64-70.86z"/>
                              </svg>
                            );
                          } else if (normalizedLoadSize === "big") {
                            return (
                              <>
                                <svg width={18} height={18} viewBox="0 0 512 512" fill={color}>
                                  <path d="M451.36 369.14C468.66 355.99 480 335.41 480 312c0-39.77-32.24-72-72-72h-14.07c13.42-11.73 22.07-28.78 22.07-48 0-35.35-28.65-64-64-64h-5.88c3.57-10.05 5.88-20.72 5.88-32 0-53.02-42.98-96-96-96-5.17 0-10.15.74-15.11 1.52C250.31 14.64 256 30.62 256 48c0 44.18-35.82 80-80 80h-16c-35.35 0-64 28.65-64 64 0 19.22 8.65 36.27 22.07 48H104c-39.76 0-72 32.23-72 72 0 23.41 11.34 43.99 28.64 57.14C26.31 374.62 0 404.12 0 440c0 39.76 32.24 72 72 72h368c39.76 0 72-32.24 72-72 0-35.88-26.31-65.38-60.64-70.86z"/>
                                </svg>
                                <svg width={18} height={18} viewBox="0 0 512 512" fill={color}>
                                  <path d="M451.36 369.14C468.66 355.99 480 335.41 480 312c0-39.77-32.24-72-72-72h-14.07c13.42-11.73 22.07-28.78 22.07-48 0-35.35-28.65-64-64-64h-5.88c3.57-10.05 5.88-20.72 5.88-32 0-53.02-42.98-96-96-96-5.17 0-10.15.74-15.11 1.52C250.31 14.64 256 30.62 256 48c0 44.18-35.82 80-80 80h-16c-35.35 0-64 28.65-64 64 0 19.22 8.65 36.27 22.07 48H104c-39.76 0-72 32.23-72 72 0 23.41 11.34 43.99 28.64 57.14C26.31 374.62 0 404.12 0 440c0 39.76 32.24 72 72 72h368c39.76 0 72-32.24 72-72 0-35.88-26.31-65.38-60.64-70.86z"/>
                                </svg>
                              </>
                            );
                          } else {
                            return (
                              <svg width={18} height={18} viewBox="0 0 512 512" fill={color}>
                                <path d="M451.36 369.14C468.66 355.99 480 335.41 480 312c0-39.77-32.24-72-72-72h-14.07c13.42-11.73 22.07-28.78 22.07-48 0-35.35-28.65-64-64-64h-5.88c3.57-10.05 5.88-20.72 5.88-32 0-53.02-42.98-96-96-96-5.17 0-10.15.74-15.11 1.52C250.31 14.64 256 30.62 256 48c0 44.18-35.82 80-80 80h-16c-35.35 0-64 28.65-64 64 0 19.22 8.65 36.27 22.07 48H104c-39.76 0-72 32.23-72 72 0 23.41 11.34 43.99 28.64 57.14C26.31 374.62 0 404.12 0 440c0 39.76 32.24 72 72 72h368c39.76 0 72-32.24 72-72 0-35.88-26.31-65.38-60.64-70.86z"/>
                              </svg>
                            );
                          }
                        })()}
                      </div>
                      {e.hadBlood ? (
                        <span title="Blood present"><BloodIcon /></span>
                      ) : null}
                      <button onClick={() => onRequestEdit(e)} style={{ border: "1px solid var(--ring)", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => onRequestDelete(e)} style={{ border: "1px solid var(--ring)", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: "pointer" }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  function ConfirmDialog({ message, confirmText = "Delete", cancelText = "Cancel", onConfirm, onCancel }: {
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal style={{ zIndex: 2000 }}>
        <div className="modal stack" style={{ gap: 12 }}>
          <div>{message}</div>
          <div className="actions">
            <button onClick={onCancel}>{cancelText}</button>
            <button className="primary" onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container">
      {userName == null ? (
        <div className="phone stack" style={{ gap: 12 }}>
          <div className="card stack" style={{ gap: 12 }}>
            <h3 style={{ margin: 0 }}>Welcome</h3>
            <div className="muted">What should we call you?</div>
            <input
              className="input"
              placeholder="Your name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
            />
            <div className="actions" style={{ justifyContent: "flex-end", marginTop: 4 }}>
              <button
                className="primary"
                onClick={() => {
                  const v = nameDraft.trim();
                  if (!v) return;
                  writeUserName(v);
                  setUserName(v);
                }}
                disabled={!nameDraft.trim()}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className="phone stack" style={{ gap: 12 }}>
        <header className="stack" style={{ gap: 8 }}>
          <h2 className="title" style={{ margin: 0 }}>{userName ? `Hey ${userName} — ${header}` : header}</h2>
        </header>

        <div style={{ position: "relative" }}>
          <MonthCalendar
            entries={entries}
            year={viewYear}
            month={viewMonth}
            onPrev={() => {
              const d = new Date(viewYear, viewMonth - 1, 1);
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
            }}
            onNext={() => {
              const d = new Date(viewYear, viewMonth + 1, 1);
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
            }}
            onDayClick={(d) => setDayModal(d)}
            streakKeys={currentStreakKeys}
            canGoNext={new Date(viewYear, viewMonth, 1) < new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
            canGoPrev={(function(){
              if (entries.length === 0) return false;
              let earliest: Date | null = null;
              for (const e of entries) {
                const d = new Date(e.timestampIso);
                if (!isNaN(d.getTime()) && (!earliest || d < earliest)) earliest = d;
              }
              if (!earliest) return false;
              const earliestMonth = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
              return new Date(viewYear, viewMonth, 1) > earliestMonth;
            })()}
          />
          {entries.length === 0 ? (
            <div className="card" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", background: "rgba(255,255,255,0.95)", zIndex: 2 }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.5 }}>NO POOPS YET</div>
              <div className="muted" style={{ marginTop: 6 }}>(Don't be shy)</div>
            </div>
          ) : null}
        </div>

        {daysSinceLast !== null && daysSinceLast > 1 ? (
          <div className="stats" style={{ gridTemplateColumns: "1fr" }}>
            <div className="stat-card">
              <div className="stat-title">Days since last poop</div>
              <div className="stat-value">{daysSinceLast} {daysSinceLast === 1 ? "day" : "days"}</div>
            </div>
          </div>
        ) : null}

        <div className="footer">
          <button className="poop-button" onClick={() => setShowForm(true)}>
            <PoopIcon />
            <span>I just pooped</span>
          </button>
        </div>

        <div className="bottom-nav">
          <div className="btn">Home</div>
          <div className="btn">Profile</div>
          <div className="btn">Progress</div>
          <div className="btn">Settings</div>
        </div>
      </div>
      )}
      {showForm ? (
        <PoopForm
          initial={{ whenIso: prefillWhenIso ?? nowIso, bristolType: 4, hadBlood: false, loadSize: "normal" }}
          onCancel={() => setShowForm(false)}
          onSave={(d) => {
            addEntry(d);
            setShowForm(false);
            setPrefillWhenIso(null);
          }}
        />
      ) : null}

      {editing ? (
        <PoopForm
          initial={{ whenIso: editing.timestampIso, bristolType: editing.bristolType, hadBlood: editing.hadBlood }}
          onCancel={() => setEditing(null)}
          onSave={(d) => {
            updateEntry(editing.id, d);
            setEditing(null);
          }}
        />
      ) : null}

      {dayModal ? (
        <DayEntriesModal
          date={dayModal}
          entries={entries}
          onClose={() => setDayModal(null)}
          onRequestDelete={(e) => setPendingDelete(e)}
          onRequestEdit={(e) => setEditing(e)}
          onAddForDay={(d) => {
            const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate(), new Date().getHours(), new Date().getMinutes()).toISOString();
            setPrefillWhenIso(iso);
            setShowForm(true);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          message="Delete this entry? This cannot be undone."
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => { deleteEntry(pendingDelete.id); setPendingDelete(null); }}
        />
      ) : null}
    </main>
  );
}


