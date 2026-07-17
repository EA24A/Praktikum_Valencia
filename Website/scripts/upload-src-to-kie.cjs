/**
 * Upload local images to Kie hosting (multipart stream API), then save URLs for image_input.
 * No third-party Blob. Same API key as createTask jobs.
 *
 * Upload base: https://kieai.redpandaai.co (see docs.kie.ai file-upload quickstart).
 * Jobs: https://api.kie.ai/api/v1/jobs/createTask
 *
 * Reads KIE_API_KEY from env / .env.local / scripts/generate-realistic.ps1
 *
 * Output: public/ai-images/src/kie-image-urls.json
 *   { "logoUrl": "...", "sources": { "photo_1.jpg": "..." } }
 *
 * Usage: node scripts/upload-src-to-kie.cjs
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const KIE_UPLOAD_BASE = process.env.KIE_UPLOAD_BASE ?? "https://kieai.redpandaai.co";
const STREAM_UPLOAD = `${KIE_UPLOAD_BASE}/api/file-stream-upload`;

const SRC_DIR = path.join(__dirname, "..", "public", "ai-images", "src");
const LOGO_PATH = path.join(__dirname, "..", "public", "ref", "logo.png");
const OUT_JSON = path.join(SRC_DIR, "kie-image-urls.json");

const SKIP_JSON = /^kie-(image-urls|blob-urls)\.json$/i;

function loadApiKey() {
  let k = process.env.KIE_API_KEY;
  if (typeof k === "string" && k.trim()) return k.trim();
  const ps1Path = path.join(__dirname, "generate-realistic.ps1");
  if (fs.existsSync(ps1Path)) {
    const raw = fs.readFileSync(ps1Path, "utf8");
    const m = raw.match(/^\s*\$API_KEY\s*=\s*"([^"]+)"/m);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  console.error(
    "Set KIE_API_KEY in env or .env.local (or migrate from scripts/generate-realistic.ps1)",
  );
  process.exit(1);
}

async function uploadStream(apiKey, filePath, uploadPath, fileName) {
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";

  const buf = fs.readFileSync(filePath);

  const form = new FormData();
  form.append("uploadPath", uploadPath.replace(/^\/+|\/+$/g, ""));
  form.append("fileName", fileName || path.basename(filePath));

  const blob = new Blob([buf], { type: mime });
  form.append("file", blob, path.basename(filePath));

  const res = await fetch(STREAM_UPLOAD, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // no Content-Type: browser/runtime sets multipart boundary
    },
    body: form,
  });

  const json = await res.json().catch(() => ({}));

  const downloadUrl =
    json?.data?.downloadUrl ??
    json?.data?.fileUrl ??
    json?.downloadUrl ??
    json?.fileUrl;

  if (!res.ok || !downloadUrl) {
    throw new Error(
      `Kie upload failed (${res.status}): ${json.msg ?? JSON.stringify(json)}`,
    );
  }

  return downloadUrl;
}

async function main() {
  const apiKey = loadApiKey();

  const filesInSrc = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !SKIP_JSON.test(f))
    .sort();

  if (filesInSrc.length === 0) {
    console.error("No images in", SRC_DIR);
    process.exit(1);
  }

  const uploadPath = "casafenicia-src";
  const sources = {};

  let logoUrl = null;
  if (fs.existsSync(LOGO_PATH)) {
    logoUrl = await uploadStream(
      apiKey,
      LOGO_PATH,
      `${uploadPath}/brand`,
      "casafenicia-logo.png",
    );
    console.log(`logo -> ${logoUrl}`);
    await delay(350);
  } else {
    console.warn("Missing public/ref/logo.png — LogoUrl fallback will be used.");
  }

  for (const name of filesInSrc) {
    const fp = path.join(SRC_DIR, name);
    try {
      sources[name] = await uploadStream(apiKey, fp, uploadPath, name);
      console.log(`${name}`);
    } catch (e) {
      console.error(`FAIL ${name}: ${e.message}`);
    }
    await delay(450);
  }

  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify({ logoUrl, sources }, null, 2),
    "utf8",
  );
  console.log(
    `\nDone. wrote ${OUT_JSON}\n (${Object.keys(sources).length} sources, logo=${Boolean(
      logoUrl,
    )})\nUploaded files expire in ~3 days (Kie temp storage).`,
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
