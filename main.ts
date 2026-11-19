// Leonida Platinum Guide — the entry program (Node 22, standard library only).
// It hands the trophy guide in: it copies this repository's app/ and
// screenshots/ to /output and writes /output/dossier.json with the vendored
// make.fun library, exactly as the kit asks. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps from the competition's gate: app/ at most 993 files and
// directories and 48 MiB, at most 4 screenshots of 256 KiB each,
// dossier.json at most 1.5 MiB. An entry over any of these is refused by
// the gate, so main.ts refuses it here first, loudly, instead of handing
// in a dead entry. NOTE: the option names and values were confirmed against
// the kit's own vendor/makefun-frontend.ts and starter/main.ts at build
// time: text_max_bytes is the dossier TEXT cap (163840, the starter's
// value), not the 1.5 MiB dossier total — the guide draft's 1572864 was
// corrected to 163840 so the dossier the gate rebuilds matches byte for
// byte.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
