import type { ReactNode } from "react";

export type IconName =
  | "book"
  | "calendar"
  | "clock"
  | "globe"
  | "arrow"
  | "left"
  | "right"
  | "check"
  | "copy"
  | "link"
  | "lock"
  | "people"
  | "chart"
  | "plus"
  | "minus"
  | "calendar-plus"
  | "calendar-check"
  | "paperclip"
  | "pencil"
  | "star"
  | "close"
  | "info"
  | "chevron"
  | "refresh"
  | "keyboard"
  | "alert";

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    book: (
      <>
        <path d="m3 5 9 3 9-3v14l-9 3-9-3zM12 8v14" />
        <path d="m7 2 5 2 5-2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 11h18m-14 4h2m3 0h2m3 0h1m-11 3h2m3 0h2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    left: <path d="m14 6-6 6 6 6" />,
    right: <path d="m10 6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    link: (
      <>
        <path
          d="m10 14 4-4m-5 6-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 10a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-2 2"
          transform="translate(1 0) scale(.95)"
        />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m3 9v-2a6 6 0 0 0-2-4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 3v17h17M9 15v-4m5 4V7m5 8v-6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    "calendar-plus": (
      <>
        <path d="M20 11V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h6M7 2v4m9-4v4M3 10h17M17 13v8m-4-4h8" />
      </>
    ),
    "calendar-check": (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 11h18m-13 5 3 3 5-5" />
      </>
    ),
    paperclip: (
      <path d="m8 14 7-7a3 3 0 0 1 4 4L9 21a5 5 0 0 1-7-7L13 3a4 4 0 0 1 6 6L9 19a2 2 0 0 1-3-3l9-9" />
    ),
    pencil: (
      <>
        <path d="m4 16 12-12a2 2 0 0 1 3 0l1 1a2 2 0 0 1 0 3L8 20l-5 1 1-5Z" />
        <path d="m13 7 4 4M4 16l4 4" />
      </>
    ),
    star: <path d="m12 3 2.7 5.8 6.3.8-4.6 4.5 1.1 6.3-5.5-3-5.5 3 1.1-6.3L3 9.6l6.3-.8L12 3Z" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v.1" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
    refresh: (
      <>
        <path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" />
      </>
    ),
    keyboard: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M6 9h.1m4 0h.1m4 0h.1m4 0h.1M6 12h.1m4 0h.1m4 0h.1m4 0h.1M7 16h10" />
      </>
    ),
    alert: (
      <>
        <path d="m10.3 4-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0ZM12 9v4m0 4v.1" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Doodle({
  name,
  className = "",
}: {
  name: "notebook" | "pencil" | "paperclip" | "clock" | "celebrate";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="#354052"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`doodle doodle-${name} ${className}`}
    >
      {name === "notebook" && (
        <g transform="rotate(-7 50 50)">
          <path d="M25 17h47a6 6 0 0 1 6 6v60H25a5 5 0 0 1-5-5V23a6 6 0 0 1 5-6Z" fill="#DCD2FF" />
          <path d="M29 17v66M69 33h15v13H69" fill="#BDE7D8" />
          <path d="M25 28H15m10 15H15m10 15H15m10 15H15" />
          <rect x="39" y="33" width="27" height="22" rx="3" fill="#FFFEF9" />
          <path d="M45 41h15m-15 7h10" stroke="#8D7BAA" />
          <path d="m55 66 4 5 9-11" stroke="#6C4DE6" strokeWidth="3" />
        </g>
      )}
      {name === "pencil" && (
        <>
          <g transform="rotate(24 56 48)">
            <path d="M48 19h16v52l-8 17-8-17V19Z" fill="#FFE391" />
            <path d="M48 19v-7a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v7" fill="#F9B5A3" />
            <path d="M48 23h16m-8 8v38M48 71h16m-11 11h6" />
          </g>
          <path d="M17 75c7-5 18-5 25-1m-28 9c10-3 20-3 28-1" stroke="#A89A78" />
          <path
            d="m19 25 2-8 3 8 8 2-8 3-2 8-3-8-7-2 7-3Z"
            fill="#DCD2FF"
            stroke="#9B86D9"
            strokeWidth="1.8"
          />
        </>
      )}
      {name === "paperclip" && (
        <g transform="rotate(18 50 50)">
          <path
            d="M38 51V28a16 16 0 0 1 32 0v40a24 24 0 0 1-48 0V33"
            stroke="#DBD1F5"
            strokeWidth="13"
          />
          <path
            d="M38 51V28a16 16 0 0 1 32 0v40a24 24 0 0 1-48 0V33m16 6v29a8 8 0 0 0 16 0V27"
            stroke="#7563A0"
            strokeWidth="4"
          />
        </g>
      )}
      {name === "clock" && (
        <>
          <path d="m26 22-9 12m58-12 9 12M31 81l-5 9m43-9 5 9" />
          <path
            d="M14 22c3-11 15-13 23-7L22 33l-8-11Zm72 0c-3-11-15-13-23-7l15 18 8-11Z"
            fill="#F7B6A8"
          />
          <circle cx="50" cy="54" r="32" fill="#FFF0BE" />
          <circle cx="50" cy="54" r="25" fill="#FFFEF9" stroke="#D5C9A8" strokeWidth="1.5" />
          <path d="M50 36v18l12 8" stroke="#6C4DE6" strokeWidth="3" />
          <path d="M50 15V9m-5 0h10" />
          <circle cx="50" cy="54" r="2.5" fill="#6C4DE6" stroke="none" />
        </>
      )}
      {name === "celebrate" && (
        <>
          <path d="m47 18 8 18 20 2-15 14 4 20-18-10-18 9 4-20-14-15 20-2 9-16Z" fill="#FFE391" />
          <path d="m76 13 3 8 9 2-8 4-2 9-4-8-9-1 8-5 3-9Z" fill="#C8EADF" strokeWidth="1.8" />
          <path d="m16 69-7 6m68-10 9 3M35 84l-2 8m46-51 9-4" stroke="#A28BBF" strokeWidth="2.5" />
          <path d="m40 48 5 6 12-13" stroke="#8C6B1F" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}
