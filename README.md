# Lingua — Interactive English Course Platform

An interactive learning app for English students, built around a course book's
media (video, audio, reading texts). Students watch/listen/read, then complete
interactive tasks (multiple choice, true/false, gap-fill) and practise
vocabulary with flashcards, matching and hangman. Teachers get a dashboard
with class progress and can add units, lessons, tasks and vocabulary.

## Tech stack

- **TanStack Start v1** (React 19, Vite 7) — full-stack SSR framework
- **Tailwind CSS v4** + shadcn/ui components
- **Lovable Cloud (Supabase)** — database, auth (email/password + Google), RLS
- **TanStack Query** for data loading

## Features

- Unit 4 "Shops & the Weekend" with 10 lessons in book order (4A–4C,
  videos, audio, reading articles, grammar quests, final "boss" test)
- Quest-style tasks: each clue's answer gives a lead to the next clue,
  second try with a hint, progress bar and quest-complete reward
- Topic-related scene images for lessons, course cards and vocabulary
- Vocabulary trainer (27 words): flashcards, matching pairs, hangman
- Student progress page; teacher dashboard with quiz scores, vocabulary
  practice and a lesson-by-lesson grid per student
- Teacher admin: add units, lessons, tasks, vocabulary (first user to claim
  the teacher role on the Teacher page becomes the teacher)
- Media files (videos/audio) are served from a CDN, so the repository stays
  small and nothing extra needs uploading

## Running locally

```bash
bun install
bun run dev
```

## Environment variables

Create a `.env` file (never commit it) with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_PROJECT_ID=...
```

The `VITE_*` values are publishable (safe for the browser). Get them from
your Lovable project's Cloud settings.

## Deploying to Vercel

1. Push this repository to GitHub (in Lovable: Plus (+) menu → GitHub →
   Connect project → Create Repository — two-way sync keeps it up to date).
2. In Vercel: **Add New → Project → Import** the GitHub repository.
3. Vercel detects Vite automatically. Build command: `vite build`
   (or `bun run build`); output is handled by the TanStack Start preset.
4. Add the environment variables above in **Project → Settings →
   Environment Variables** (both the `VITE_*` and server-side ones).
5. Deploy.

Notes:

- The database and auth stay on Lovable Cloud — Vercel only hosts the app,
  which talks to the same backend via the environment variables.
- Server functions run as Vercel serverless functions; no extra config needed.
- See the full guide: https://docs.lovable.dev/tips-tricks/self-hosting

## Project structure

```
src/
  routes/            # TanStack Router file-based routes
    _authenticated/  # routes behind the auth guard (dashboard, lessons, ...)
  components/        # UI + task games (Flashcards, Matching, Hangman, TaskRunner)
  lib/               # session hook, course data hooks, types
  integrations/      # generated Supabase clients (do not edit)
supabase/            # migrations (schema + seeded Unit 4 content)
```
