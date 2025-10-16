"use client";

import { useEffect, useMemo, useState } from "react";

type PoopEntry = {
  id: string;
  timestampIso: string; // ISO string
  bristolType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hadBlood: boolean;
};

const STORAGE_KEY = "poopr.entries.v1";

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
    <svg className="icon poop" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c1.6 2 .5 3.5-1 4.5 2 .3 3.5 1.5 3.5 3.5 0 .7-.2 1.3-.6 1.9h.1c3.3 0 6 2.7 6 6 0 1.7-1.3 3-3 3H7c-2 0-3.5-1.4-3.5-3.5 0-2.9 2.3-5.2 5.2-5.2-.4-.5-.7-1.2-.7-1.9 0-1.8 1.2-3 2.7-3.5C10 5 9.5 3.5 12 2z" />
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
}: {
  entries: PoopEntry[];
  year: number;
  month: number; // 0-11
  onPrev: () => void;
  onNext: () => void;
  onDayClick?: (d: Date) => void;
  streakKeys?: Set<string>;
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
        <button aria-label="Previous month" onClick={onPrev} style={{ border: "1px solid var(--ring)", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: "pointer" }}>
          ←
        </button>
        <div style={{ fontWeight: 700 }}>{monthName}</div>
        <button aria-label="Next month" onClick={onNext} style={{ border: "1px solid var(--ring)", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: "pointer" }}>
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
          const inStreak = streakKeys?.has(k);
          return (
            <button
              key={d.toISOString() || Math.random()}
              className={`day${has ? " pooped" : ""}${inStreak ? " streak" : ""}`}
              aria-label={d.toDateString()}
              style={{ opacity: isCurrentMonth ? 1 : 0.4, background: "#fff", border: "1px dashed var(--ring)", borderRadius: 10, cursor: "pointer" }}
              onClick={() => onDayClick?.(d)}
            >
              <div className="day-date">{formatDateNum(d)}</div>
              {has ? <div className="poop-dot" title="Pooped" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Draft = {
  whenIso: string;
  bristolType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hadBlood: boolean;
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
    <div className="modal-backdrop" role="dialog" aria-modal>
      <div className="modal stack" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>Log a poop</h3>
        {/* Date & Time removed per request; entries will use the provided timestamp */}
        <div className="stack">
          <span className="muted">Bristol stool chart</span>
          <div className="chart">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => (
              <button
                key={n}
                aria-pressed={bristolType === n}
                onClick={() => setBristolType(n)}
                title={`Type ${n}`}
                style={{ gridColumn: n <= 4 ? n : n - 3, gridRow: n <= 4 ? 1 : 2 }}
              >
                <img
                  src={`/bristol/type${n}.svg`}
                  alt={`Bristol type ${n}`}
                  style={{ width: "100%", height: 48, objectFit: "contain" }}
                />
                <div style={{ fontWeight: 600, marginTop: 4, fontSize: 14 }}>Type {n}</div>
                <div className="muted" style={{ fontSize: 10 }}>
                  {n === 1
                    ? "Hard, separate lumps"
                    : n === 2
                    ? "Lumpy, sausage-shaped"
                    : n === 3
                    ? "Sausage with cracks"
                    : n === 4
                    ? "Smooth, soft (ideal)"
                    : n === 5
                    ? "Soft blobs, pass easily"
                    : n === 6
                    ? "Mushy, fluffy pieces"
                    : "Watery, no solid pieces"}
                </div>
              </button>
            ))}
          </div>
        </div>
        <label className="blood-toggle">
          <input
            type="checkbox"
            checked={hadBlood}
            onChange={(e) => setHadBlood(e.target.checked)}
          />
          <BloodIcon />
          <span>Blood present</span>
        </label>
        <div className="sheet-actions actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={() => onSave({ whenIso, bristolType, hadBlood })}>Confirm</button>
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

  useEffect(() => {
    setEntries(readEntries());
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

  function DayEntriesModal({ date, entries, onClose, onRequestDelete, onRequestEdit }: {
    date: Date;
    entries: PoopEntry[];
    onClose: () => void;
    onRequestDelete: (e: PoopEntry) => void;
    onRequestEdit: (e: PoopEntry) => void;
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
      <div className="modal-backdrop" role="dialog" aria-modal>
        <div className="modal stack" style={{ gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button onClick={onClose}>Close</button>
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
                      <PoopIcon size={18} />
                      <div>{formatTime(dt)}</div>
                    </div>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <span>Type {e.bristolType}</span>
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
      <div className="modal-backdrop" role="dialog" aria-modal>
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
      <div className="phone stack" style={{ gap: 12 }}>
        <header className="stack" style={{ gap: 8 }}>
          <h2 className="title" style={{ margin: 0 }}>{header}</h2>
        </header>

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
        />

        <div className="stats">
          <div className="stat-card">
            <div className="stat-title">This Streak</div>
            <div className="stat-value">{currentStreak} {currentStreak === 1 ? "day" : "days"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Longest Streak</div>
            <div className="stat-value">{longestStreak} {longestStreak === 1 ? "day" : "days"}</div>
          </div>
        </div>

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

      {showForm ? (
        <PoopForm
          initial={{ whenIso: nowIso, bristolType: 4, hadBlood: false }}
          onCancel={() => setShowForm(false)}
          onSave={(d) => {
            addEntry(d);
            setShowForm(false);
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


