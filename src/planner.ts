export type Availability = Record<string, number[]>;
export type Respondent = { id: string; name: string; availability: Availability };
export type Match = { date: string; start: number; end: number };
export type AvailabilityRange = { start: number; end: number };

export const SLOT_MINUTES = 15;

export const DEFAULT_DATES = [
  "2026-09-21",
  "2026-09-22",
  "2026-09-23",
  "2026-09-24",
  "2026-09-25",
  "2026-09-28",
  "2026-09-29",
  "2026-09-30",
];

export function timeLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function durationError(raw: string): string | null {
  if (!raw.trim()) return "Enter a session duration.";
  if (!/^\d+$/.test(raw.trim())) return "Enter a whole number of minutes.";
  const value = Number(raw);
  if (value < SLOT_MINUTES || value > 1440) return "Choose a duration from 15 to 1440 minutes.";
  if (value % SLOT_MINUTES !== 0) return "Use 15-minute increments, such as 45, 90 or 300.";
  return null;
}

export function durationDescription(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  const converted = hours
    ? `${hours} ${hours === 1 ? "hour" : "hours"}${remaining ? ` ${remaining} min` : ""}`
    : `${minutes} min`;
  return `${minutes} minutes · ${converted}`;
}

export function parseClockTime(raw: string, allowEndOfDay = false): number | null {
  if (!/^\d{1,2}:\d{2}$/.test(raw.trim())) return null;
  const [hours, minutes] = raw.trim().split(":").map(Number);
  if (allowEndOfDay && hours === 24 && minutes === 0) return 1440;
  if (hours > 23 || minutes < 0 || minutes > 59 || minutes % SLOT_MINUTES !== 0) return null;
  return hours * 60 + minutes;
}

export function dateLabel(date: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", options);
}

export function slotsBetween(start: number, end: number) {
  return Array.from(
    { length: Math.max(0, (end - start) / SLOT_MINUTES) },
    (_, i) => start / SLOT_MINUTES + i,
  );
}

export function availabilityRanges(
  availability: Availability,
  dates: string[],
  start = 0,
  end = 1440,
) {
  return dates.flatMap((date) => {
    const slots = [
      ...new Set(
        (availability[date] || []).filter((slot) => {
          const minutes = slot * SLOT_MINUTES;
          return minutes >= start && minutes < end;
        }),
      ),
    ].sort((a, b) => a - b);
    if (!slots.length) return [];
    const ranges: AvailabilityRange[] = [];
    let first = slots[0];
    let previous = first;
    for (const slot of slots.slice(1)) {
      if (slot === previous + 1) {
        previous = slot;
        continue;
      }
      ranges.push({ start: first * SLOT_MINUTES, end: (previous + 1) * SLOT_MINUTES });
      first = slot;
      previous = slot;
    }
    ranges.push({ start: first * SLOT_MINUTES, end: (previous + 1) * SLOT_MINUTES });
    return [{ date, ranges }];
  });
}

export function exampleResponses(dates: string[]): Respondent[] {
  const first = dates[0] || DEFAULT_DATES[0];
  const shared = dates[1] || first;
  return [
    {
      id: "sofia",
      name: "Sofia Chen",
      availability: {
        [first]: slotsBetween(600, 660),
        [shared]: slotsBetween(780, 900),
      },
    },
    {
      id: "luca",
      name: "Luca Rossi",
      availability: {
        [first]: slotsBetween(960, 1020),
        [shared]: slotsBetween(840, 960),
      },
    },
    {
      id: "you",
      name: "Alex Morgan",
      availability: {
        [first]: slotsBetween(540, 600),
        [shared]: slotsBetween(840, 900),
      },
    },
  ];
}

export function findMatches(
  responses: Respondent[],
  dates: string[],
  duration: number,
  start: number,
  end: number,
): Match[] {
  if (
    !responses.length ||
    !Number.isInteger(duration) ||
    duration < SLOT_MINUTES ||
    duration > 1440 ||
    duration % SLOT_MINUTES !== 0
  )
    return [];
  const matches: Match[] = [];
  for (const date of dates) {
    for (let candidate = start; candidate + duration <= end; candidate += SLOT_MINUTES) {
      const slots = slotsBetween(candidate, candidate + duration);
      if (
        responses.every((person) =>
          slots.every((slot) => (person.availability[date] || []).includes(slot)),
        )
      ) {
        matches.push({ date, start: candidate, end: candidate + duration });
      }
    }
  }
  return matches;
}

export function countSlots(
  availability: Availability,
  dates: string[],
  start: number,
  end: number,
) {
  return dates.reduce(
    (total, date) =>
      total +
      (availability[date] || []).filter(
        (slot) => slot * SLOT_MINUTES >= start && slot * SLOT_MINUTES < end,
      ).length,
    0,
  );
}
