# PooPr

Track your daily poop patterns with a simple week calendar.

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Run the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Features

- Week calendar shows last 7 days; brown dot marks poop days
- "I just pooped" button opens a form
- Form includes:
  - Date & time (defaults to now)
  - Bristol stool chart (Type 1–7)
  - Blood presence toggle
- Data persists locally via `localStorage` (no backend)

## Notes
- Requires Node 18.17+.
