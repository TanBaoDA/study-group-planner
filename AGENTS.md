# Instructions for AI coding agents

This repo is a **mid-fidelity clickable prototype** (React 19 + TypeScript + Vite 8 + Tailwind v4) of the Study Group Planner, a university HCI course project. Read `README.md` first for features and structure.

## Commands

- Install: `pnpm install` (npm also works)
- Dev server: `pnpm dev`
- Must pass after every change: `pnpm test`, `pnpm typecheck`, `pnpm build`

## Rules

1. **Keep the mid-fi wireframe style.** Grayscale only (`#000 #333 #666 #999 #ccc #e5e5e5 #f5f5f5 #fff`), one `system-ui` font, 14/16/24 px text, 4 px radius, 1 px borders, no shadows, gradients, colours, emoji or illustrations. Images/logos/avatars are `.wireframe-placeholder` boxes with an X.
2. **Time unit is 15 minutes.** Use `SLOT_MINUTES` from `src/planner.ts`; never hard-code 30 or 15. Slot index = minutes / 15.
3. **Don't break the availability grid interactions** in `AvailabilityCalendar` (`src/App.tsx`): click toggles a cell; dragging selects (or, when starting on a selected cell, erases) the rectangle between the start and current cell across dates and times; it uses `onPointerMove` on `.time-grid` + `document.elementFromPoint` and `data-date` / `data-slot` attributes so touch and pen work too.
4. **Results view** shows each respondent's availability as text ranges per date (`availabilityRanges`), not as a grid.
5. Put matching/validation logic in `src/planner.ts` (pure functions) and cover it with a test in `src/planner.test.mjs`.
6. Styling goes in `src/index.css` (plain class names, global element styles inside `@layer base`).
7. No backend yet: state is in memory. If you add one (planned: Supabase + Vercel), keep the prototype runnable without credentials.
8. Keep accessibility: labels on inputs, `aria-*` on custom controls, visible focus outline, 4.5:1 contrast.
9. Write UI copy in English.
