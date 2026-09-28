# 🌙 Mood & Symptom Tracker

> Planning notes only — **no code here yet**. This app is being built by
> Shiori herself, by hand, as part of the 2026 OKR below. Nothing in this
> file is meant to be copy-pasted; it's a reference for decisions already
> made, so a future session (or future Shiori) can pick this up without
> re-deciding everything from scratch.

## Why this app exists

Formal 2026 OKR: **"Build an app with own API, DB and authentication"**
(goal cycle 2026 Goals, 07 May 2026 – 31 Dec 2026). Key results:

- Develop an API for the app with clear documentation and endpoints
- Set up a secure and scalable database for the app
- Implement user authentication functionality with proper user roles and permissions
- (Optional) Add interface (front-end)

This app is the real deliverable for that goal — replacing the (AI-built)
Timesheet app as the running project, so every part of it is understood
first-hand. `../backend-study/` remains the curriculum (phased roadmap +
exercises); this is where those skills get applied for real.

## The idea

A mood tracker where **mood is the centerpiece** — not a single 1–5 scale,
but a growing personal vocabulary of feelings (motivated, calm, grateful, anxious, etc.). Physical symptoms (headache, fatigue, poor
sleep...) are tracked as a **separate**, independent log — deliberately
not mixed into mood entries.

## v1 decisions (locked in 25 Sep 2026)

- **Check-in frequency:** multiple times a day, timestamped — not one
  daily summary.
- **Moods per check-in:** one mood per check-in (kept simple on purpose;
  could become many-to-many later if that changes).
- **Symptoms:** their own catalog + their own log, on their own timeline,
  separate from mood check-ins.
- **Users:** single-user for now (just Shiori). No sharing / "viewer"
  role planned for v1 — auth (Phase 3) is about protecting her own data,
  not multi-user roles for other people. (A read-only share-with-someone
  role was discussed as a nice-to-have but explicitly deferred.)
- **Where it lives:** `~/ai/mood-tracker/` — its own project, separate
  from `backend-study/`.

## Rough shape, for reference (not final — design it herself)

Two catalog + log pairs, similar in spirit to backend-study's
`Category` → `HourEntry` relationship:

- `Mood` (catalog: id, label) → `MoodCheckIn` (timestamp, note, which mood)
- `Symptom` (catalog: id, label) → `SymptomLog` (timestamp, severity, note, which symptom)

## Status as of 25 Sep 2026

Planning only. A scaffold (package.json, Prisma schema, db client) was
generated and then deliberately deleted — Shiori wants to build this one
herself from an empty folder, with mentoring/review rather than
AI-written code. Next actual step is up to her.

## Data model (v1, designed 28 Sep 2026)

Two lookup tables (the list of options) and two entry tables (what actually gets logged).
Each entry points to one option by its `id`.

### Mood — the list of moods to pick from

| Column | Type     | Required | Notes                                  |
|--------|----------|----------|----------------------------------------|
| id     | Int      | yes      | Primary key, auto-increment            |
| name   | String   | yes      | Unique, e.g. "calm", "grateful", "self-hate" |

### MoodEntry — one mood check-in (can be many per day)

| Column       | Type     | Required | Notes                                      |
|--------------|----------|----------|--------------------------------------------|
| id           | Int      | yes      | Primary key, auto-increment                |
| moodId       | Int      | yes      | Links to `Mood.id`                         |
| createdAt    | DateTime | yes      | Defaults to now                            |
| feelingScore | Int      | no       | 1–5, **5 = feels good**                    |
| trigger      | String   | no       | What caused the mood                       |

### Symptom — the list of physical symptoms

| Column | Type     | Required | Notes                                  |
|--------|----------|----------|----------------------------------------|
| id     | Int      | yes      | Primary key, auto-increment            |
| name   | String   | yes      | Unique, e.g. "headache", "fatigue"     |

### SymptomEntry — one logged symptom (separate timeline from moods)

| Column    | Type     | Required | Notes                                      |
|-----------|----------|----------|--------------------------------------------|
| id        | Int      | yes      | Primary key, auto-increment                |
| symptomId | Int      | yes      | Links to `Symptom.id`                      |
| createdAt | DateTime | yes      | Defaults to now                            |
| intensity | Int      | no       | 1–5, **5 = most severe**                   |
| trigger   | String   | no       | What caused the symptom                    |

### Design decisions

- **Lookup tables instead of plain text or enums**, so moods and symptoms can be added
  at runtime, typos can't create duplicates, and renaming happens in one place.
- **Scales point in opposite directions:** `feelingScore` 5 = good, `intensity` 5 = bad.
  Keep this in mind when building charts.
- **Ranges (1–5) are checked by the API, not the database.** Prisma + SQLite will accept
  any integer, so validation happens in the route before saving.
- **`trigger` instead of a free-text note** for now, since it's narrower and more useful
  for later queries ("what triggers show up most?"). A general `note` column can be
  added later with a simple migration.
- **Not in v1:** mood intensity, multiple moods per check-in, users/auth (Phase 3).