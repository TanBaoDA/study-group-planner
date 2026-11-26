import { Icon } from "./components/Icons";
import { DurationStepper, ClockTimeField } from "./components/PlannerControls";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DEFAULT_DATES,
  SLOT_MINUTES,
  availabilityRanges,
  countSlots,
  dateLabel,
  exampleResponses,
  findMatches,
  slotsBetween,
  timeLabel,
  type Availability,
  type Respondent,
} from "./planner";

type View = "create" | "share" | "availability" | "results";

function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "text";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}

function EventSummary({
  title,
  dates,
  duration,
}: {
  title: string;
  dates: string[];
  duration: number;
}) {
  return (
    <div className="event-summary">
      <div>
        <strong>{title || "Untitled study session"}</strong>
        <p>
          <span>
            <Icon name="calendar" size={16} />
            {dates.length} candidate dates
          </span>
          <span>
            <Icon name="clock" size={16} />
            {duration} minutes
          </span>
          <span>
            <Icon name="globe" size={16} />
            Europe/Amsterdam
          </span>
        </p>
      </div>
    </div>
  );
}

function MonthPicker({
  dates,
  onChange,
}: {
  dates: string[];
  onChange: (dates: string[]) => void;
}) {
  const [month, setMonth] = useState(8);
  const [year, setYear] = useState(2026);
  const start = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const moveMonth = (n: number) => {
    const next = new Date(year, month + n, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };
  return (
    <div className="month-picker">
      <div className="month-toolbar">
        <strong>
          {new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </strong>
        <div className="flex gap-1">
          <button
            className="icon-btn"
            onClick={() => moveMonth(-1)}
            aria-label="Previous month"
            type="button"
          >
            <Icon name="left" size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => moveMonth(1)}
            aria-label="Next month"
            type="button"
          >
            <Icon name="right" size={16} />
          </button>
        </div>
      </div>
      <div className="month-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span className="weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: start }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          const selected = dates.includes(date);
          return (
            <button
              type="button"
              key={date}
              className={`month-day ${selected ? "is-selected" : ""} ${(start + i) % 7 > 4 ? "weekend" : ""}`}
              aria-label={`${dateLabel(date, { day: "numeric", month: "long", year: "numeric" })}${selected ? ", selected" : ""}`}
              aria-pressed={selected}
              onClick={() =>
                onChange(selected ? dates.filter((d) => d !== date) : [...dates, date].sort())
              }
            >
              {i + 1}
              {selected && <span className="date-dot" />}
            </button>
          );
        })}
      </div>
      <div className="month-bottom">
        <span>
          <i className="legend-box selected" />
          Selected date
        </span>
        <strong>{dates.length} dates selected</strong>
      </div>
    </div>
  );
}

function AvailabilityCalendar({
  dates,
  start,
  end,
  value,
  onChange,
  readOnly = false,
  disabled = false,
}: {
  dates: string[];
  start: number;
  end: number;
  value: Availability;
  onChange?: (value: Availability) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    date: string;
    start: number;
    selecting: boolean;
    original: Availability;
    last: string;
  } | null>(null);
  const visibleDates = dates.slice(page * 7, page * 7 + 7);
  const rows = slotsBetween(start, end);
  const pages = Math.max(1, Math.ceil(dates.length / 7));
  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);
  useEffect(() => {
    if (scrollRef.current) {
      const rowHeight =
        Number.parseFloat(getComputedStyle(scrollRef.current).getPropertyValue("--slot-height")) ||
        42;
      scrollRef.current.scrollTop = Math.max(0, ((720 - start) / SLOT_MINUTES) * rowHeight);
    }
  }, [start]);
  useEffect(() => {
    const stop = () => {
      drag.current = null;
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);
  const applyDrag = (date: string, slot: number) => {
    const state = drag.current;
    const key = `${date}|${slot}`;
    if (!state || state.last === key || !onChange) return;
    state.last = key;
    const from = dates.indexOf(state.date);
    const to = dates.indexOf(date);
    if (from === -1 || to === -1) return;
    const lo = Math.min(state.start, slot);
    const hi = Math.max(state.start, slot);
    const next = { ...state.original };
    for (const currentDate of dates.slice(Math.min(from, to), Math.max(from, to) + 1)) {
      const slots = new Set(state.original[currentDate] || []);
      for (let s = lo; s <= hi; s++) {
        if (state.selecting) slots.add(s);
        else slots.delete(s);
      }
      next[currentDate] = [...slots].sort((a, b) => a - b);
    }
    onChange(next);
  };
  return (
    <div className={`availability-calendar ${readOnly ? "read-only" : ""}`}>
      <div className="calendar-toolbar">
        <div className="flex items-center gap-2">
          <Icon name="calendar" size={17} />
          <strong>
            {visibleDates.length
              ? `${dateLabel(visibleDates[0], { day: "numeric", month: "short" })} – ${dateLabel(visibleDates[visibleDates.length - 1], { day: "numeric", month: "short", year: "numeric" })}`
              : "No dates selected"}
          </strong>
        </div>
        <div className="date-pagination">
          <span>
            Page {page + 1} of {pages}
          </span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Previous date page"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <Icon name="left" size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Next date page"
            disabled={page === pages - 1}
            onClick={() => setPage(page + 1)}
          >
            <Icon name="right" size={16} />
          </button>
        </div>
      </div>
      <div
        className="calendar-scroll"
        ref={scrollRef}
        tabIndex={0}
        aria-label="Availability calendar, scroll to see more times"
      >
        <div
          className="time-grid"
          style={{
            gridTemplateColumns: "86px repeat(7, minmax(100px, 1fr))",
          }}
          onPointerMove={
            readOnly
              ? undefined
              : (e) => {
                  if (!drag.current) return;
                  const cell = document
                    .elementFromPoint(e.clientX, e.clientY)
                    ?.closest<HTMLElement>("[data-date][data-slot]");
                  if (cell?.dataset.date && cell.dataset.slot) {
                    applyDrag(cell.dataset.date, Number(cell.dataset.slot));
                  }
                }
          }
        >
          <div className="calendar-corner">
            <span>Time</span>
          </div>
          {visibleDates.map((date) => (
            <div className="date-heading" key={date}>
              <span>{dateLabel(date, { weekday: "short" })}</span>
              <strong>
                {dateLabel(date, { day: "numeric" })}
                <small>{dateLabel(date, { month: "short" })}</small>
              </strong>
            </div>
          ))}
          {Array.from({ length: 7 - visibleDates.length }, (_, index) => (
            <div
              key={`empty-heading-${index}`}
              className="date-heading empty-date-column"
              aria-hidden="true"
            />
          ))}
          {rows.map((slot) => (
            <CalendarRow
              key={slot}
              slot={slot}
              dates={visibleDates}
              emptyColumns={7 - visibleDates.length}
              value={value}
              readOnly={readOnly}
              disabled={disabled}
              onPointerStart={(date) => {
                drag.current = {
                  date,
                  start: slot,
                  selecting: !(value[date] || []).includes(slot),
                  original: value,
                  last: "",
                };
                applyDrag(date, slot);
              }}
              onToggle={(date) => {
                const current = value[date] || [];
                onChange?.({
                  ...value,
                  [date]: current.includes(slot)
                    ? current.filter((s) => s !== slot)
                    : [...current, slot].sort((a, b) => a - b),
                });
              }}
            />
          ))}
        </div>
      </div>
      <div className="calendar-legend">
        <div>
          <span>
            <i className="legend-box selected" />
            {readOnly ? "Available" : "Your availability"}
          </span>
          <span>
            <i className="legend-box" />
            Not selected
          </span>
        </div>
        <span>
          {readOnly ? "Read-only availability" : "Click or drag across dates and times to select"}
        </span>
      </div>
    </div>
  );
}

function CalendarRow({
  slot,
  dates,
  emptyColumns,
  value,
  readOnly,
  disabled,
  onPointerStart,
  onToggle,
}: {
  slot: number;
  dates: string[];
  emptyColumns: number;
  value: Availability;
  readOnly: boolean;
  disabled: boolean;
  onPointerStart: (date: string) => void;
  onToggle: (date: string) => void;
}) {
  const minutes = slot * SLOT_MINUTES;
  const isQuarterHour = minutes % 30 !== 0;
  return (
    <>
      <div
        className={`time-label ${minutes % 60 === 30 ? "half-hour" : ""} ${isQuarterHour ? "quarter-hour" : ""}`}
      >
        {isQuarterHour ? "" : timeLabel(minutes)}
      </div>
      {dates.map((date) => {
        const selected = (value[date] || []).includes(slot);
        const begins = selected && !(value[date] || []).includes(slot - 1);
        const ends = selected && !(value[date] || []).includes(slot + 1);
        const label = `${dateLabel(date, { weekday: "long", day: "numeric", month: "long" })}, ${timeLabel(minutes)} to ${timeLabel(minutes + SLOT_MINUTES)}, ${selected ? "available" : "not selected"}`;
        const className = `time-cell ${isQuarterHour ? "quarter-hour" : ""} ${selected ? "selected" : ""} ${begins ? "range-start" : ""} ${ends ? "range-end" : ""}`;
        const content = (
          <>
            {begins && (
              <span>
                {timeLabel(minutes)}
                <Icon name="check" size={12} />
              </span>
            )}
            {ends && !begins && (
              <span className="range-end-label">{timeLabel(minutes + SLOT_MINUTES)}</span>
            )}
          </>
        );
        return readOnly ? (
          <div key={date} className={className} aria-label={label}>
            {content}
          </div>
        ) : (
          <button
            key={date}
            type="button"
            className={className}
            disabled={disabled}
            aria-label={label}
            aria-pressed={selected}
            data-date={date}
            data-slot={slot}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              e.currentTarget.releasePointerCapture?.(e.pointerId);
              onPointerStart(date);
            }}
            onClick={(e) => {
              if (e.detail === 0) onToggle(date);
            }}
          >
            {content}
          </button>
        );
      })}
      {Array.from({ length: emptyColumns }, (_, index) => (
        <div key={`empty-${index}`} className="time-cell empty-date-column" aria-hidden="true" />
      ))}
    </>
  );
}

const VIEWS: { id: View; label: string }[] = [
  { id: "create", label: "Create event" },
  { id: "share", label: "Share event" },
  { id: "availability", label: "Availability" },
  { id: "results", label: "Results" },
];

export default function App() {
  const initialView = new URLSearchParams(window.location.search).get("view") as View;
  const [view, setView] = useState<View>(
    VIEWS.some((v) => v.id === initialView) ? initialView : "create",
  );
  const [title, setTitle] = useState("Microeconomics study session");
  const [dates, setDates] = useState<string[]>(DEFAULT_DATES);
  const [start, setStart] = useState(480);
  const [end, setEnd] = useState(1320);
  const [fullDay, setFullDay] = useState(false);
  const [duration, setDuration] = useState(90);
  const [durationValid, setDurationValid] = useState(true);
  const [startValid, setStartValid] = useState(true);
  const [endValid, setEndValid] = useState(true);
  const [durationControlKey, setDurationControlKey] = useState(0);
  const [created, setCreated] = useState(Boolean(initialView));
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  const [name, setName] = useState("");
  const [availability, setAvailability] = useState<Availability>({});
  const [saveState, setSaveState] = useState<"idle" | "editing" | "saving" | "saved" | "error">(
    "idle",
  );
  const [saveError, setSaveError] = useState("");
  const [responses, setResponses] = useState<Respondent[]>(() =>
    exampleResponses(DEFAULT_DATES).slice(0, 2),
  );
  const [snapshot, setSnapshot] = useState<Respondent[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState(false);
  const [individualOpen, setIndividualOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [failSave, setFailSave] = useState(false);
  const [failResults, setFailResults] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeDate, setRangeDate] = useState(DEFAULT_DATES[1]);
  const [rangeStart, setRangeStart] = useState(840);
  const [rangeEnd, setRangeEnd] = useState(900);
  const [rangeError, setRangeError] = useState("");
  const [rangeNotice, setRangeNotice] = useState("");
  const windowStart = fullDay ? 0 : start;
  const windowEnd = fullDay ? 1440 : end;
  const selectedSlots = countSlots(availability, dates, windowStart, windowEnd);
  const currentStep = VIEWS.findIndex((v) => v.id === view);
  const matches = useMemo(
    () => findMatches(snapshot || [], dates, duration, windowStart, windowEnd),
    [snapshot, dates, duration, windowStart, windowEnd],
  );
  const displayedResponses = snapshot ?? responses;
  const responsesChanged =
    snapshot !== null && JSON.stringify(snapshot) !== JSON.stringify(responses);
  const times = Array.from({ length: 97 }, (_, i) => i * SLOT_MINUTES);
  const busy = creating || loadingResults || saveState === "saving";
  const navigate = (next: View) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setSelection = (next: Availability) => {
    setAvailability(next);
    setSaveState("editing");
    setSaveError("");
    setRangeNotice("");
  };
  const createEvent = async () => {
    if (!durationValid || (!fullDay && (!startValid || !endValid))) {
      setCreateError("Check the duration and survey times before creating your event.");
      return;
    }
    if (!title.trim()) {
      setCreateError("Give your event a title so your group knows what it is for.");
      return;
    }
    if (!dates.length) {
      setCreateError("Select at least one candidate date.");
      return;
    }
    if (windowEnd <= windowStart || windowEnd - windowStart < duration) {
      setCreateError("The daily survey window must be at least as long as your session.");
      return;
    }
    setCreateError("");
    setCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setCreated(true);
    setCreating(false);
    setResponses(exampleResponses(dates).slice(0, 2));
    setSnapshot(null);
    setAvailability({});
    setSaveState("idle");
    navigate("share");
  };
  const copyLink = async (kind: "invitation" | "organiser") => {
    const url = new URL(window.location.href);
    url.search =
      kind === "invitation"
        ? "?view=availability&event=study-session"
        : "?view=results&manage=private-demo";
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url.href);
      else {
        const field = document.createElement("textarea");
        field.value = url.href;
        document.body.appendChild(field);
        field.select();
        const success = document.execCommand("copy");
        field.remove();
        if (!success) throw new Error("Copy unavailable");
      }
      setCopied(kind);
      setCopyError("");
      window.setTimeout(() => setCopied(""), 3500);
    } catch {
      setCopyError(
        "Your browser could not copy the link. Select the link above and copy it manually.",
      );
    }
  };
  const useExample = () => {
    const example = exampleResponses(dates)[2];
    setName(example.name);
    setAvailability(example.availability);
    setSaveState("editing");
    setSaveError("");
  };
  const submitAvailability = async () => {
    if (!name.trim()) {
      setSaveError("Enter a display name before submitting.");
      document.getElementById("display-name")?.focus();
      return;
    }
    if (!selectedSlots) {
      setSaveError("Select at least one available time, or enter a time range.");
      return;
    }
    setSaveState("saving");
    setSaveError("");
    await new Promise((resolve) => setTimeout(resolve, 750));
    if (failSave) {
      setFailSave(false);
      setSaveState("error");
      setSaveError(
        "We couldn't save your availability. Your selections are safe. Please try again.",
      );
      return;
    }
    const cleanAvailability = Object.fromEntries(
      dates.map((date) => [
        date,
        (availability[date] || []).filter(
          (slot) => slot * SLOT_MINUTES >= windowStart && slot * SLOT_MINUTES < windowEnd,
        ),
      ]),
    );
    setResponses((current) => [
      ...current.filter((r) => r.id !== "you"),
      { id: "you", name: name.trim(), availability: cleanAvailability },
    ]);
    setSaveState("saved");
  };
  const requestResults = async () => {
    if (!durationValid) {
      document.getElementById("results-duration")?.focus();
      return;
    }
    setLoadingResults(true);
    setResultsError(false);
    await new Promise((resolve) => setTimeout(resolve, 850));
    setLoadingResults(false);
    if (failResults) {
      setFailResults(false);
      setResultsError(true);
      return;
    }
    setSnapshot(structuredClone(responses));
    setUpdatedAt(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Amsterdam",
      }),
    );
  };
  const loadRecovery = () => {
    const data = exampleResponses(dates);
    setResponses(data);
    setSnapshot(structuredClone(data));
    setDuration(90);
    setDurationControlKey((key) => key + 1);
    setDurationValid(true);
    setUpdatedAt("14:32");
    setResultsError(false);
    setCreated(true);
    setDemoOpen(false);
    setIndividualOpen(false);
    navigate("results");
  };
  const addRange = () => {
    if (!dates.includes(rangeDate)) {
      setRangeError("Choose one of the candidate dates.");
      return;
    }
    if (rangeStart < windowStart || rangeEnd > windowEnd || rangeEnd <= rangeStart) {
      setRangeError("Choose an end after the start, within the survey window.");
      return;
    }
    const next = new Set([
      ...(availability[rangeDate] || []),
      ...slotsBetween(rangeStart, rangeEnd),
    ]);
    setSelection({ ...availability, [rangeDate]: [...next].sort((a, b) => a - b) });
    setRangeError("");
    setRangeNotice(
      `Added ${timeLabel(rangeStart)}–${timeLabel(rangeEnd)} on ${dateLabel(rangeDate, { day: "numeric", month: "short" })}.`,
    );
  };
  const pageTitles: Record<View, string> = {
    create: "Create a study event",
    share: "Share your event",
    availability: "Your availability",
    results: "Group results",
  };
  const pageHints: Record<View, string> = {
    create: "Pick a few dates. We’ll help your group find its moment.",
    share: "One link for your study crew. One just for you.",
    availability: "Make a little room for learning together.",
    results: "A shared time, with everyone included.",
  };
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a
            href="?view=create"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              navigate("create");
            }}
          >
            <span className="wireframe-placeholder brand-placeholder" aria-hidden="true" />
            Study Group Planner
          </a>
          <div className="header-info">
            <span className="header-note">
              <Icon name="check" size={16} />
              No account needed
            </span>
            <span className="role-pill">
              {view === "availability" ? "Participant view" : "Organiser view"}
            </span>
          </div>
        </div>
      </header>
      <main className={`planner-box view-${view}`}>
        <nav className="step-nav" aria-label="Planning steps">
          {VIEWS.map((item, i) => (
            <button
              key={item.id}
              className={`step-item ${view === item.id ? "active" : ""}`}
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? "step" : undefined}
            >
              <span className="step-number">
                {created && i < currentStep ? <Icon name="check" size={16} /> : i + 1}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="page-heading">
          <div>
            <p className="page-kicker">
              STEP {currentStep + 1} OF 4 <span>·</span> THE STUDY PLAN
            </p>
            <h1>{pageTitles[view]}</h1>
            <p className="page-hint">{pageHints[view]}</p>
          </div>
        </div>

        {view === "create" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void createEvent();
            }}
          >
            <div className="create-form">
              <div className="event-fields">
                <div>
                  <label className="field-label" htmlFor="event-title">
                    Event title
                  </label>
                  <input
                    id="event-title"
                    className="text-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Microeconomics study session"
                  />
                </div>
                <div className="duration-field create-duration">
                  <label className="field-label" htmlFor="duration">
                    Session duration
                  </label>
                  <DurationStepper
                    key={`create-${durationControlKey}`}
                    value={duration}
                    onChange={setDuration}
                    onValidityChange={setDurationValid}
                  />
                </div>
                <div className="survey-window">
                  <div className="field-label">Daily survey window</div>
                  <div className="clock-fields">
                    <ClockTimeField
                      id="window-start"
                      label="Start"
                      value={fullDay ? 0 : start}
                      disabled={fullDay}
                      onChange={setStart}
                      onValidityChange={setStartValid}
                    />
                    <span className="clock-to">to</span>
                    <ClockTimeField
                      id="window-end"
                      label="End"
                      value={fullDay ? 1440 : end}
                      disabled={fullDay}
                      allowEndOfDay
                      onChange={setEnd}
                      onValidityChange={setEndValid}
                    />
                  </div>
                  <p id="survey-time-hint" className="field-note time-hint">
                    24-hour time · 15-minute steps
                  </p>
                  {!fullDay && end <= start && (
                    <p className="control-error" role="alert">
                      The end time must be after the start time.
                    </p>
                  )}
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={fullDay}
                      onChange={(e) => setFullDay(e.target.checked)}
                    />
                    Full day (00:00–24:00)
                  </label>
                </div>
                <p className="timezone-note">
                  <Icon name="globe" size={17} />
                  Europe/Amsterdam
                </p>
              </div>
              <section className="dates-field">
                <div className="dates-heading">
                  <h2>Candidate dates</h2>
                </div>
                <p className="field-note">Select all the dates your group could meet.</p>
                <MonthPicker dates={dates} onChange={setDates} />
              </section>
            </div>
            {createError && (
              <div className="error-message" role="alert">
                <Icon name="alert" size={18} />
                {createError}
              </div>
            )}
            <div className="action-footer">
              <span className="next-step-note">
                Next up: invite your study crew <Icon name="arrow" size={17} />
              </span>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <span className="spinner" />
                    Creating event…
                  </>
                ) : (
                  <>
                    <Icon name="calendar-plus" size={22} />
                    Create event
                    <Icon name="arrow" size={19} />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {view === "share" && (
          <div className="share-view">
            <EventSummary title={title} dates={dates} duration={duration} />
            <section className="share-card">
              <label className="field-label" htmlFor="invitation-link">
                Participant invitation link
              </label>
              <p className="field-note">Anyone with this link can submit availability.</p>
              <div className="link-row">
                <div className="link-field">
                  <Icon name="link" size={19} />
                  <input
                    id="invitation-link"
                    readOnly
                    value={`${window.location.origin}/?view=availability&event=study-session`}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <Button onClick={() => void copyLink("invitation")}>
                  <Icon name={copied === "invitation" ? "check" : "copy"} size={18} />
                  {copied === "invitation" ? "Link copied" : "Copy invitation link"}
                </Button>
              </div>
              {copied === "invitation" && (
                <p className="copy-feedback" role="status">
                  <Icon name="check" size={16} />
                  Invitation link copied
                </p>
              )}
            </section>
            <section className="share-card private-card">
              <label className="field-label" htmlFor="organiser-link">
                Organiser-management link{" "}
                <span className="private-badge">
                  <Icon name="lock" size={13} />
                  Private
                </span>
              </label>
              <p className="field-note">Only for you. Keep this link private to manage results.</p>
              <div className="link-row">
                <div className="link-field">
                  <Icon name="lock" size={19} />
                  <input
                    id="organiser-link"
                    readOnly
                    value={`${window.location.origin}/?view=results&manage=private-demo`}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <Button variant="secondary" onClick={() => void copyLink("organiser")}>
                  <Icon name={copied === "organiser" ? "check" : "copy"} size={18} />
                  {copied === "organiser" ? "Link copied" : "Copy organiser link"}
                </Button>
              </div>
              {copied === "organiser" && (
                <p className="copy-feedback" role="status">
                  <Icon name="check" size={16} />
                  Organiser link copied
                </p>
              )}
            </section>
            {copyError && (
              <div className="error-message" role="alert">
                <Icon name="alert" size={18} />
                {copyError}
              </div>
            )}
            <div className="action-footer">
              <span className="demo-note">Demo links do not store or protect data.</span>
              <Button variant="secondary" onClick={() => navigate("availability")}>
                Enter availability
                <Icon name="arrow" size={18} />
              </Button>
            </div>
          </div>
        )}

        {view === "availability" && (
          <div className="availability-view">
            <div className="availability-top">
              <EventSummary title={title} dates={dates} duration={duration} />
              <div className="name-field">
                <label className="field-label" htmlFor="display-name">
                  Display name
                </label>
                <input
                  className="text-input"
                  id="display-name"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  maxLength={50}
                  disabled={saveState === "saved" || saveState === "saving"}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaveState("editing");
                    setSaveError("");
                  }}
                />
              </div>
            </div>
            <div className="availability-instructions">
              <p>Click or drag, also diagonally across dates, to select 15-minute blocks.</p>
              <Button
                variant="text"
                onClick={() => {
                  setRangeOpen(!rangeOpen);
                  if (!dates.includes(rangeDate)) setRangeDate(dates[0]);
                }}
                disabled={saveState === "saved" || saveState === "saving"}
              >
                <Icon name="keyboard" size={19} />
                Enter time range
                <Icon name="chevron" size={15} />
              </Button>
            </div>
            {rangeOpen && saveState !== "saved" && (
              <div className="range-form">
                <div className="range-fields">
                  <label>
                    Date
                    <select
                      aria-label="Date"
                      value={rangeDate}
                      onChange={(e) => setRangeDate(e.target.value)}
                    >
                      {dates.map((date) => (
                        <option key={date} value={date}>
                          {dateLabel(date, { weekday: "short", day: "numeric", month: "short" })}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Start
                    <select
                      aria-label="Start"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(Number(e.target.value))}
                    >
                      {times
                        .filter((t) => t >= windowStart && t < windowEnd)
                        .map((t) => (
                          <option value={t} key={t}>
                            {timeLabel(t)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    End
                    <select
                      aria-label="End"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(Number(e.target.value))}
                    >
                      {times
                        .filter((t) => t > windowStart && t <= windowEnd)
                        .map((t) => (
                          <option value={t} key={t}>
                            {timeLabel(t)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <Button variant="secondary" onClick={addRange} disabled={saveState === "saving"}>
                    <Icon name="plus" size={17} />
                    Add range
                  </Button>
                </div>
                {rangeError && (
                  <p className="range-error" role="alert">
                    {rangeError}
                  </p>
                )}
                {rangeNotice && (
                  <p className="range-success" role="status">
                    <Icon name="check" size={16} />
                    {rangeNotice}
                  </p>
                )}
              </div>
            )}
            <AvailabilityCalendar
              dates={dates}
              start={windowStart}
              end={windowEnd}
              value={availability}
              onChange={setSelection}
              disabled={saveState === "saved" || saveState === "saving"}
            />
            {saveError && (
              <div className="error-message" role="alert">
                <Icon name="alert" size={18} />
                {saveError}
              </div>
            )}
            {saveState === "saved" && (
              <div className="saved-banner" role="status">
                <Icon name="check" size={19} />
                <strong>Availability saved.</strong>
                <Button variant="text" onClick={() => setSaveState("editing")}>
                  Edit availability
                </Button>
              </div>
            )}
            <div className="action-footer availability-footer">
              <div className="selection-summary">
                <strong>
                  {selectedSlots ? `${selectedSlots / 4} hours selected` : "No times selected"}
                </strong>
                <span>
                  {saveState === "saved" ? (
                    "Saved"
                  ) : saveState === "editing" ? (
                    "Unsaved changes"
                  ) : saveState === "error" ? (
                    "Not saved"
                  ) : saveState === "saving" ? (
                    "Saving…"
                  ) : (
                    <button className="inline-link" onClick={useExample}>
                      Try example availability
                    </button>
                  )}
                </span>
              </div>
              {saveState === "saved" ? (
                <Button onClick={() => navigate("results")}>
                  View organiser results
                  <Icon name="arrow" size={18} />
                </Button>
              ) : (
                <Button onClick={() => void submitAvailability()} disabled={saveState === "saving"}>
                  {saveState === "saving" ? (
                    <>
                      <span className="spinner" />
                      Saving availability…
                    </>
                  ) : (
                    <>
                      <Icon name="calendar-check" size={22} />
                      {saveState === "error" ? "Try submitting again" : "Submit availability"}
                      <Icon name="arrow" size={18} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {view === "results" && (
          <div className="results-view">
            <EventSummary title={title} dates={dates} duration={duration} />
            <div className="results-layout">
              <div className="results-main">
                <section className="results-paper">
                  <div className="results-paper-heading">
                    <h2>Shared study times</h2>
                    <Button
                      onClick={() => void requestResults()}
                      disabled={loadingResults || !responses.length}
                    >
                      {loadingResults ? (
                        <>
                          <span className="spinner" />
                          Finding times…
                        </>
                      ) : (
                        <>
                          <Icon name={snapshot ? "refresh" : "chart"} size={21} />
                          {snapshot ? "Update results" : "View results"}
                        </>
                      )}
                    </Button>
                  </div>
                  {resultsError && (
                    <div className="error-message" role="alert">
                      <Icon name="alert" size={19} />
                      <span>
                        Couldn’t retrieve responses.{" "}
                        {snapshot ? "Your previous results are unchanged." : "Please try again."}
                      </span>
                    </div>
                  )}
                  {loadingResults ? (
                    <div className="results-empty" role="status">
                      <div className="loading-ring" />
                      <h3>Finding a time for everyone…</h3>
                      <p>Checking every response, for the whole session.</p>
                    </div>
                  ) : !snapshot ? (
                    <div className="results-empty">
                      <h3>
                        {responses.length ? "Your next session starts here." : "No responses yet"}
                      </h3>
                      <p>
                        {responses.length
                          ? "View results to find a time that fits your whole group."
                          : "Share the invitation to get your study crew started."}
                      </p>
                      {!responses.length && (
                        <Button variant="secondary" onClick={() => navigate("share")}>
                          <Icon name="link" size={20} />
                          Share invitation
                        </Button>
                      )}
                    </div>
                  ) : !snapshot.length ? (
                    <div className="results-empty">
                      <h3>No submitted responses</h3>
                      <p>Share your invitation, then update results.</p>
                    </div>
                  ) : !matches.length ? (
                    <div className="no-match-state">
                      <h3>No shared {duration}-minute time</h3>
                      <p>
                        No interval fits all <strong>{snapshot.length} respondents</strong>.
                      </p>
                      <span>Try a shorter duration, or explore individual availability below.</span>
                    </div>
                  ) : (
                    <div className="match-results">
                      <div className="match-success">
                        <div>
                          <h3>A little overlap. A great start.</h3>
                          <p>
                            {matches.length} {matches.length === 1 ? "time works" : "times work"}{" "}
                            for everyone in your group.
                          </p>
                        </div>
                      </div>
                      {[...new Set(matches.map((m) => m.date))].map((date) => (
                        <section className="date-result" key={date}>
                          <h3>
                            <Icon name="calendar" size={20} />
                            {dateLabel(date, { weekday: "long", day: "numeric", month: "long" })}
                          </h3>
                          <div className="date-options">
                            {matches
                              .filter((m) => m.date === date)
                              .map((match) => (
                                <div className="match-slot" key={match.start}>
                                  <div>
                                    <span className="match-time">
                                      <Icon name="clock" size={20} />
                                      <strong>
                                        {timeLabel(match.start)} <span>–</span>{" "}
                                        {timeLabel(match.end)}
                                      </strong>
                                    </span>
                                    <span className="match-duration">{duration} minutes</span>
                                  </div>
                                  <span className="everyone-label">
                                    <Icon name="check" size={17} />
                                    All {snapshot.length} available
                                  </span>
                                </div>
                              ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                  {snapshot && !loadingResults && (
                    <p className="results-caption">
                      <Icon name="check" size={16} />
                      Based on {snapshot.length} submitted responses · Updated at {updatedAt}
                      <span>Europe/Amsterdam</span>
                    </p>
                  )}
                  {responsesChanged && (
                    <div className="refresh-notice">
                      <Icon name="refresh" size={18} />
                      Responses changed. Click “Update results” to refresh.
                    </div>
                  )}
                </section>
                <section className="individual-panel">
                  <button
                    className="individual-toggle"
                    aria-label="View individual availability"
                    onClick={() => setIndividualOpen(!individualOpen)}
                    aria-expanded={individualOpen}
                  >
                    <span>
                      <Icon name="people" size={21} />
                      View individual availability<span className="read-only-label">Read-only</span>
                    </span>
                    <Icon name="chevron" size={20} className={individualOpen ? "rotate-180" : ""} />
                  </button>
                  {individualOpen && (
                    <div className="individual-content">
                      {displayedResponses.length ? (
                        <div className="individual-list">
                          {displayedResponses.map((person) => {
                            const grouped = availabilityRanges(
                              person.availability,
                              dates,
                              windowStart,
                              windowEnd,
                            );
                            return (
                              <section className="individual-person" key={person.id}>
                                <h3>{person.name}</h3>
                                {grouped.length ? (
                                  <dl>
                                    {grouped.map(({ date, ranges }) => (
                                      <div key={date}>
                                        <dt>
                                          {dateLabel(date, {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </dt>
                                        <dd>
                                          {ranges
                                            .map(
                                              (range) =>
                                                `${timeLabel(range.start)}–${timeLabel(range.end)}`,
                                            )
                                            .join(", ")}
                                        </dd>
                                      </div>
                                    ))}
                                  </dl>
                                ) : (
                                  <p>No availability</p>
                                )}
                              </section>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="field-note">No submitted availability yet.</p>
                      )}
                    </div>
                  )}
                </section>
              </div>
              <aside className="results-sidebar">
                <section className="duration-card">
                  <label className="field-label" htmlFor="results-duration">
                    Session duration
                  </label>
                  <DurationStepper
                    key={`results-${durationControlKey}`}
                    value={duration}
                    onChange={setDuration}
                    onValidityChange={setDurationValid}
                    id="results-duration"
                  />
                  <p className="recalculate-note">
                    Changing duration recalculates the responses shown here.
                  </p>
                </section>
                <section className="response-line">
                  <div className="responses-heading">
                    <h2>Submitted responses</h2>
                    <span className="response-count">{displayedResponses.length}</span>
                  </div>
                  <div className="respondent-list">
                    {displayedResponses.length ? (
                      displayedResponses.map((person, i) => (
                        <div className="respondent" key={person.id}>
                          <span className={`respondent-avatar avatar-${i % 3}`}>
                            {person.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div>
                            <strong>{person.name}</strong>
                            <span>
                              <Icon name="check" size={14} />
                              Availability submitted
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="field-note">No responses yet</p>
                    )}
                  </div>
                  <p className="responses-note">
                    <Icon name="info" size={17} />
                    <span>
                      New responses are retrieved only when you click “
                      {snapshot ? "Update" : "View"} results”.
                    </span>
                  </p>
                </section>
              </aside>
            </div>
          </div>
        )}
      </main>
      <div className="prototype-tools">
        <span className="prototype-disclaimer">
          Interactive prototype · Changes stay in this session
        </span>
        <button
          className="demo-toggle"
          disabled={busy}
          onClick={() => setDemoOpen(!demoOpen)}
          aria-expanded={demoOpen}
        >
          Prototype examples
          <Icon name="chevron" size={15} />
        </button>
        {demoOpen && !busy && (
          <div className="demo-popover">
            <button onClick={loadRecovery}>90 → 60 min recovery example</button>
            <button
              onClick={() => {
                setAvailability({});
                setName("");
                setSaveState("idle");
                setSaveError("");
                setDemoOpen(false);
                navigate("availability");
              }}
            >
              Empty availability
            </button>
            <button
              onClick={() => {
                useExample();
                setFailSave(true);
                setDemoOpen(false);
                navigate("availability");
              }}
            >
              Try a save error
            </button>
            <button
              onClick={() => {
                setResponses([]);
                setSnapshot(null);
                setResultsError(false);
                setDemoOpen(false);
                navigate("results");
              }}
            >
              No submitted responses
            </button>
            <button
              onClick={() => {
                setFailResults(true);
                setDemoOpen(false);
                navigate("results");
              }}
            >
              Try a results error
            </button>
            <p>Synthetic data · Session-only changes</p>
          </div>
        )}
      </div>
    </div>
  );
}
