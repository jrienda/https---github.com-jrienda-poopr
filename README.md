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

## OpenAI integration (optional)

Create a `.env.local` file in the project root with:

```
OPENAI_API_KEY=your_api_key_here
```

Then you can call the Edge route `POST /api/openai` with a JSON body:

```
{
  "messages": [
    { "role": "user", "content": "Summarize my poop trends" }
  ]
}
```

This proxies to OpenAI Chat Completions using the `gpt-4o-mini` model.

## Notes
- Requires Node 18.17+.
