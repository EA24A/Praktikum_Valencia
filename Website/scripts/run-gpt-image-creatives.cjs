/**
 * 90 creatives: 30 EN + 30 AR + 30 ES — GPT Image 2 image-to-image via Kie API.
 *
 * Ensures Arabic reaches the API as UTF-8 JSON from Node (avoids PWSH / legacy JSON issues).
 *
 * Prerequisites:
 *   - public/ai-images/src/kie-image-urls.json (npm run kie:upload-src)
 *
 * Env: KIE_API_KEY or key in scripts/generate-realistic.ps1
 *
 *   node scripts/run-gpt-image-creatives.cjs
 *   node scripts/run-gpt-image-creatives.cjs --outDir=kie-gpt-creatives
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const PROJECT_ROOT = path.join(__dirname, "..");
const BASE_URL = "https://api.kie.ai";
const MODEL = "gpt-image-2-image-to-image";

const LANG_ORDER = ["en", "ar", "es"];
const PER_LANG = 30;

/** GPT Image limits aspect_ratio to these strings (no 4:5) */
const ASPECTS = ["1:1", "9:16", "16:9", "4:3", "3:4"];

const LAYOUT_VARIANTS = [
  "narrow gold metallic rules framing copy only — leave food untouched except natural lighting match",
  "editorial serif headline stripe across top fifth — cinematic negative space",
  "minimal Swiss asymmetric grid — one gold underline separating headline tiers",
  "magazine-cover split thirds — typography in upper matte black band only",
  "diagonal translucent gold veil limited to typography mask — multiply blend sparingly",
  "postcard deco corners — ornate thin lines never crossing hero subject",
  "Bold condensed headline stack — heroic scale typography",
  "soft radial vignette into corners preserving centre dish clarity",
  "bottom heavy black typography bar reserving food in upper glow",
  "ultra slim hairline rectangles echoing Lebanese geometric motifs behind type",
  "double column bilingual micro layout within side rail — headline dominant",
  "duotone noir film grain solely on typography blocks",
  "circular medallion halo behind logo inset — symmetrical balance",
  "brushstroke matte divider behind subtitles only — oil-paint tactile edge",
  "stacked kinetic type with slight shear — energetic street billboard",
  "glassmorphism translucent panel blurred behind lettering only — AR glass depth",
  "emboss simulated gold foil stamp effect on headline characters",
  "vertical ribbon sash from top-right carrying secondary line text",
  "arch-top curved headline following barrel vault geometry — prestige dining cue",
  "split-colour typography — warm gold / cool bone white interplay",
  "micro grain paper texture typography bed — tactile print ad",
  "isometric miniature label patch — witty premium snack cues",
  "layered translucent cards depth — headline on forward plane",
  "copper-hot foil gradient stroke outlining headline silhouette",
  "negative space halo cutout letters revealing subtle wood grain photographic layer underneath type field only",
  "modular mosaic tile hint as faint typography backdrop — Moorish restraint",
  "wide cinematic letterbox typography band strictly outside food silhouette",
  "parallax-esque offset duplicated thin ghost typography for depth illusion",
  "soft neon-edge outline halo but only on letters — nightclub luxe understatement",
  "structured bento typography modules — restrained Japanese grid homage in gold-black palette",
];

function loadApiKey() {
  let k = process.env.KIE_API_KEY;
  if (typeof k === "string" && k.trim()) return k.trim();
  const ps1 = path.join(__dirname, "generate-realistic.ps1");
  if (fs.existsSync(ps1)) {
    const raw = fs.readFileSync(ps1, "utf8");
    const m = raw.match(/^\s*\$API_KEY\s*=\s*"([^"]+)"/m);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  throw new Error("Set KIE_API_KEY (.env.local) or key in scripts/generate-realistic.ps1");
}

function parseArgs(argv) {
  let outDirName = "kie-gpt-creatives";
  for (const a of argv) {
    const m = a.match(/^--outDir=(.+)$/);
    if (m) outDirName = m[1].trim().replace(/^["']|["']$/g, "");
  }
  return { outDirName };
}

function loadImageUrls() {
  const jp = path.join(PROJECT_ROOT, "public", "ai-images", "src", "kie-image-urls.json");
  const raw = JSON.parse(fs.readFileSync(jp, "utf8"));
  let logoUrl = raw.logoUrl || "";
  const sourcesMap = raw.sources || raw;
  const orderedNames = fs
    .readdirSync(path.join(PROJECT_ROOT, "public", "ai-images", "src"))
    .filter(
      (f) =>
        /\.(jpe?g|png|webp)$/i.test(f) &&
        !/^kie-(image-urls|blob-urls)\.json$/i.test(f),
    )
    .sort();
  const photos = [];
  for (const name of orderedNames) {
    const url = typeof sourcesMap[name] === "string" ? sourcesMap[name] : null;
    if (url) photos.push({ name, url });
  }
  if (!logoUrl || !photos.length)
    throw new Error(
      "kie-image-urls.json missing logoUrl or matched photos — npm run kie:upload-src",
    );
  return { logoUrl, photos };
}

function buildPrompt(lang, headline, sub, layoutIx) {
  const layout =
    LAYOUT_VARIANTS[layoutIx % LAYOUT_VARIANTS.length] ||
    LAYOUT_VARIANTS[LAYOUT_VARIANTS.length - 1];

  let langBlock = "";
  if (lang === "ar") {
    langBlock = `
LANGUAGE & SCRIPT (CRITICAL — Arabic RTL):
• Use proper Arabic typography, right‑to‑left, with correctly joined/connecting Arabic letters (not isolated boxes, not ???, definitely not Latin transliteration pretending to be Arabic).
• HEADLINE LINE (Arabic only, verbatim character-for-character Arabic script):
"${headline}"
• SUBTITLE LINE (Arabic only):
"${sub}"
`;
  } else if (lang === "es") {
    langBlock = `
LANGUAGE: Spanish.

HEADLINE (exact text, correct accents):
"${headline}"

SUBTITLE (exact text):
"${sub}"
`;
  } else {
    langBlock = `
LANGUAGE: English.

HEADLINE (exact text):
"${headline}"

SUBTITLE (exact text):
"${sub}"
`;
  }

  return [
    "COMMERCIAL AD CREATIVE for Casa Fenicia Lebanese bistro Valencia — premium black + brushed gold Mediterranean luxury.",
    "",
    "BASE PHOTO (first INPUT image): Preserve the SAME real photographed scene faithfully — identical dish / interior / façade / plating geometry, reflections, imperfections, shadows, textures, focal length. Forbidden: hallucinating substitutes, widening plates, CGI replacement, caricature smoothing, swapping architecture.",
    "BRAND GRAPHIC (second INPUT image reference): Harmonise subtly with the circular gold‑on‑black Casa Fenicia ship emblem — weave as designed brand element.",
    "",
    langBlock.trim(),
    "",
    `VISUAL STYLE / LAYOUT VARIANT (unique cue #${layoutIx + 1}): ${layout}`,
    "",
    "Graphic layer rules: Typography must be razor‑sharp mega‑readable, ultra‑high contrast, never obscuring focal food/restaurant hero anchor. Respect brand palette black / warm gold / off‑white. Photoreal untouched core subject dominates centre mass.",
    "Output photographic ad quality suitable for sponsored social + homepage hero rotations.",
  ].join("\n");
}

async function submitTask(apiKey, prompt, aspectRatio, inputUrls, name) {
  const bodyObj = {
    model: MODEL,
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      resolution: "2K",
      input_urls: inputUrls,
    },
  };

  const res = await fetch(`${BASE_URL}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: JSON.stringify(bodyObj),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.code !== 200 || !j.data?.taskId) {
    console.error(JSON.stringify(bodyObj, null, 2).slice(0, 2000));
    throw new Error(`${name}: submit HTTP ${res.status} — ${JSON.stringify(j)}`);
  }
  console.log(`${name}\t\t${j.data.taskId}`);
  return j.data.taskId;
}

async function pollTask(apiKey, taskId) {
  const res = await fetch(
    `${BASE_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  const j = await res.json().catch(() => ({}));
  return j?.data?.state === "success"
    ? { done: true, ok: true, data: j.data }
    : j?.data?.state === "fail"
      ? {
          done: true,
          ok: false,
          failMsg: j.data?.failMsg || j.msg || "fail",
        }
      : { done: false };
}

async function downloadUrlToFile(srcUrl, filePath) {
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { outDirName } = parseArgs(process.argv.slice(2));
  const apiKey = loadApiKey();
  const { logoUrl, photos } = loadImageUrls();

  const linesJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "kie-gpt-creatives-lines.json"), "utf8"),
  );

  const outAbs = path.join(PROJECT_ROOT, "public", "ai-images", outDirName);

  /** @type {{ name:string, taskId:string }[]} */
  const tasks = [];
  let seq = 0;
  let photoCursor = 0;

  console.log(`Submitting ${PER_LANG * LANG_ORDER.length} jobs (${MODEL}) …`);

  for (const lang of LANG_ORDER) {
    const lineArr = linesJson[lang];
    if (!Array.isArray(lineArr) || lineArr.length < PER_LANG) {
      throw new Error(
        `kie-gpt-creatives-lines.json['${lang}'] must contain at least ${PER_LANG} rows`,
      );
    }
    for (let i = 0; i < PER_LANG; i++) {
      const { headline, sub } = lineArr[i];
      const slug = path.basename(
        photos[photoCursor % photos.length].name,
        path.extname(photos[photoCursor % photos.length].name),
      );
      const photoUrl = photos[photoCursor % photos.length].url;
      photoCursor++;

      const aspect = ASPECTS[(seq + i + lang.charCodeAt(0)) % ASPECTS.length];
      const layoutIx = seq;
      const prompt = buildPrompt(lang, headline, sub, layoutIx);
      const fileBase = `${String(++seq).padStart(3, "0")}-${lang}-${slug}`;
      const name = `gpt-${fileBase}`;
      try {
        const taskId = await submitTask(apiKey, prompt, aspect, [photoUrl, logoUrl], name);
        tasks.push({ name, taskId });
      } catch (e) {
        console.error(e.message);
      }
      await delay(500);
    }
  }

  const maxWait = 320 * 60 * 1000;
  const started = Date.now();
  /** terminal taskIds */
  const settled = {};
  console.log("\nPolling …");

  while (
    tasks.some((x) => !settled[x.taskId]) &&
    Date.now() - started < maxWait
  ) {
    for (const t of tasks) {
      if (settled[t.taskId]) continue;
      try {
        const st = await pollTask(apiKey, t.taskId);
        if (!st.done) continue;
        settled[t.taskId] = true;
        if (st.ok) {
          let url0 = null;
          try {
            const raw = st.data?.resultJson;
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw || {};
            url0 =
              (Array.isArray(parsed.resultUrls) && parsed.resultUrls[0]) ||
              parsed.downloadUrl ||
              parsed.imageUrl ||
              parsed.url ||
              null;
          } catch (_) {
            /* ignore */
          }
          if (url0) {
            await downloadUrlToFile(url0, path.join(outAbs, `${t.name}.jpg`));
            console.log(`saved ${t.name}`);
          } else {
            console.error(`FAIL ${t.name}: missing resultUrls in payload`);
          }
        } else console.error(`FAIL ${t.name}: ${st.failMsg}`);
      } catch (_) {
        /* transient */
      }
    }
    await delay(5000);
    const pending = tasks.filter((x) => !settled[x.taskId]).length;
    if (pending > 0) {
      console.log(
        `${pending} pending (${Math.round((Date.now() - started) / 1000)} s)`,
      );
    }
  }

  const okCount = tasks.filter((t) => settled[t.taskId]).length;
  console.log(`\nDone (${okCount} tasks terminal). JPGs → public/ai-images/${outDirName}/`);
  const stalled = tasks.filter((t) => !settled[t.taskId]).map((x) => x.name);
  if (stalled.length) console.warn(`${stalled.length} tasks unresolved (polling timeout or API glitch).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
