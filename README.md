# Leonida Platinum Guide — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/vora95/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/vora95/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A static web app that covers all 55 PlayStation 5 trophies of Grand Theft
Auto VI and tracks your progress through them. Open it in a desktop browser
from any static file server; once loaded it needs no network at all.

## What you get

- The full official list: every trophy with its exact PlayStation name,
  official description and grade, plus a guide in our own words that names
  its sources — what to do, where and how, and whether it can be missed.
- A checklist that remembers itself in the browser (localStorage), with a
  personal note field per trophy, progress totals per grade, and export /
  import of your progress as a JSON file.
- Search plus filters for kind, grade and status, and a spoiler switch that
  keeps story trophies hidden until you have earned them.
- A four-phase roadmap to the Platinum, built from the official descriptions,
  with the missable trophies flagged.
- A sources page that says exactly where each name, description and grade
  was checked.

## Running it

Serve the `app/` folder with any static server (or open `app/index.html`
directly) and use desktop Chrome. Nothing leaves your browser unless you
press Export.

## About the data

Names, descriptions and grades were checked on 19 November 2026 against the
live PlayStation list as mirrored by Exophase — 55 entries with real unlock
rarity — and cross-checked against five independent complete lists
(OutputLag, HowToVideoGame, Press-Start, GamesRadar+ / PC Gamer, GTABase).
Rockstar, Sony and Microsoft have not published a list through their own
channels, and the app's sources page says so. Five hidden trophies still have
no confirmed unlock method at launch; the app says that plainly rather than
inventing one. Xbox Gamerscore numbers are left out entirely: the published
values disagree with each other.

## Building the hand-in

`main.ts` (Node 22) copies `app/` and `screenshots/` into `/output` and
writes `/output/dossier.json` using the vendored make.fun library. The
screenshots are genuine browser renders of the app (see `shots.json`).

## License

MIT. Grand Theft Auto and GTA are trademarks of Rockstar Games. This is an
independent fan-made tracker, not affiliated with Rockstar, and it uses no
Rockstar logo or official artwork.

---

<sub>Entered on [make.fun](https://make.fun/?ref=05axmjqh&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
