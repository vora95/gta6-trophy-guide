# Leonida Platinum Guide — GTA VI Trophy Guide & Tracker

An offline web app: the complete guide and tracker for the 55 PlayStation 5
trophies of Grand Theft Auto VI. Static files that open in a desktop browser
and work with the network off.

## What it does

- Every one of the 55 official trophies, by exact name, with its official
  description and grade, and a guide to it in our own words that cites its
  sources: what to do, where and how, and when it can be missed.
- A checklist saved in the browser (localStorage), with personal notes per
  trophy, progress by grade, export and import as JSON.
- Filters by kind, grade and status, plus search.
- A spoiler setting that hides story trophies until they are earned.
- A roadmap to the Platinum in four phases, built from the official
  descriptions, with the missable trophies flagged.
- A sources page naming where every name, description and grade was verified.

## Use it

Serve `app/` with any static file server (or open `app/index.html` directly)
and use it in desktop Chrome. No network needed; nothing leaves your browser
except when you choose Export.

## Data

Trophy names, descriptions and grades were verified 19 November 2026 against
the live PlayStation trophy list as mirrored by Exophase (55 entries, with
real unlock rarity) and cross-checked against five independent full lists
(OutputLag, HowToVideoGame, Press-Start, GamesRadar+/PC Gamer, GTABase).
Rockstar, Sony and Microsoft have not published a list on their own channels;
the app says so on its sources page. Five hidden trophies have no confirmed
unlock method yet at launch — the app says so honestly instead of inventing
one. No Gamerscore values are shown: published Xbox values conflict between
sources.

## Build

`main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library. Screenshots are
real renders of the app in a browser (see `shots.json`).

## License

MIT. Grand Theft Auto and GTA are trademarks of Rockstar Games; this guide is
an independent fan-made tracker, not affiliated with or endorsed by Rockstar.
No Rockstar logo or official artwork is used.
