// Leonida Platinum Guide — the entry program, Node 22, standard library
// only. It takes this repository's app/ and screenshots/ and hands them in
// as /output, with /output/dossier.json written by the vendored make.fun
// library. Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in
// for /output, so a local run looks like:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// Gate caps, confirmed against the kit's own vendor/makefun-frontend.ts and
// starter/main.ts at build time. text_max_bytes is the dossier TEXT cap
// (163840, the starter's value) — not the 1.5 MiB dossier total, which the
// guide draft had mistakenly used here (1572864). The gate rebuilds the
// dossier with its own caps, so handing in a dossier built under the wrong
// text cap would fail dossier_matches outright.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

writeFileSync(join(out, "dossier.json"), buildDossier(out, dossierCaps));
