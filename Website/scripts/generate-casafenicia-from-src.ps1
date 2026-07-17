[CmdletBinding()]
param(
    [ValidateSet("nano-banana-pro")]
    [string]$Model = "nano-banana-pro",

    [string]$LogoUrl = "",

    [string]$OutDirName = "kie-src-generated",

    [int]$Total = 100,

    # Optional: path to kie-image-urls.json (from npm run kie:upload-src)
    [string]$UrlMapPath = "",

    [string]$AdCopyJson = "",

    # If files are already public at /ai-images/src/ on your domain, use this instead of upload.
    [string]$PublicBaseUrl = ""
)

$ErrorActionPreference = "Stop"
$PSScriptParent = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $PSScriptParent
$SRC_DIR = Join-Path $PROJECT_ROOT "public\ai-images\src"
$OUT_DIR = Join-Path $PROJECT_ROOT "public\ai-images\$OutDirName"
$KIE_MAP = if ($UrlMapPath) { $UrlMapPath } else { Join-Path $SRC_DIR "kie-image-urls.json" }
$KIE_MAP_LEGACY = Join-Path $SRC_DIR "kie-blob-urls.json"
$AD_JSON = if ($AdCopyJson) { $AdCopyJson } else { Join-Path $PSScriptParent "kie-ad-copy.json" }

function Get-KieApiKey {
    if ($env:KIE_API_KEY -and $env:KIE_API_KEY.Trim()) { return $env:KIE_API_KEY.Trim() }
    $lf = Join-Path $PROJECT_ROOT ".env.local"
    if (Test-Path $lf) {
        Get-Content $lf | ForEach-Object {
            $m = [regex]::Match($_, '^\s*KIE_API_KEY\s*=\s*"?([^"#]+)"?\s*(?:#.*)?$')
            if ($m.Success) { return $m.Groups[1].Value.Trim() }
        }
    }
    $legacy = Join-Path $PSScriptParent "generate-realistic.ps1"
    if (Test-Path $legacy) {
        $mr = [regex]::Match((Get-Content -LiteralPath $legacy -Raw), '(?m)^\s*\$API_KEY\s*=\s*"([^"]+)"\s*$')
        if ($mr.Success -and $mr.Groups[1].Value.Trim()) { return $mr.Groups[1].Value.Trim() }
    }
    throw "Set KIE_API_KEY env var, add it to .env.local, or migrate the key out of scripts/generate-realistic.ps1"
}

New-Item -ItemType Directory -Force $OUT_DIR | Out-Null

$nameToUrl = @{}
$mapPathUsed = $null

if ($PublicBaseUrl.Trim()) {
    $base = $PublicBaseUrl.Trim().TrimEnd('/')
    foreach ($item in @(Get-ChildItem -LiteralPath $SRC_DIR -File | Where-Object {
                $_.Name -match '\.(jpg|jpeg|png|webp)$' -and $_.Name -notmatch '^kie-(image-urls|blob-urls)\.json$'
            })) {
        $nameToUrl[$item.Name] = "$base/ai-images/src/$($item.Name)"
    }
}
elseif (Test-Path $KIE_MAP) {
    $mapPathUsed = $KIE_MAP
    $doc = Get-Content $KIE_MAP -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($doc.sources) {
        $doc.sources.PSObject.Properties | ForEach-Object { $nameToUrl[$_.Name] = [string]$_.Value }
    }
    else {
        $doc.PSObject.Properties | Where-Object { $_.Name -ne 'logoUrl' } | ForEach-Object { $nameToUrl[$_.Name] = [string]$_.Value }
    }
    if ([string]::IsNullOrWhiteSpace($LogoUrl) -and $doc.logoUrl) {
        $LogoUrl = [string]$doc.logoUrl
    }
}
elseif (Test-Path $KIE_MAP_LEGACY) {
    $mapPathUsed = $KIE_MAP_LEGACY
    $doc = Get-Content $KIE_MAP_LEGACY -Raw -Encoding UTF8 | ConvertFrom-Json
    $doc.PSObject.Properties | ForEach-Object { $nameToUrl[$_.Name] = [string]$_.Value }
}
else {
    Write-Host @"
No kie-image-urls.json and no -PublicBaseUrl.

Upload your src photos directly to Kie (base64 API), then generate:

  npm run kie:upload-src
  powershell -File scripts/generate-casafenicia-from-src.ps1

Or after deploy: -PublicBaseUrl `"https://www.casafenicia.com`"
"@ -ForegroundColor Yellow
    throw "No image URL mapping"
}

if ([string]::IsNullOrWhiteSpace($LogoUrl)) {
    $LogoUrl = "https://casafenicia.vercel.app/ref/logo.png"
}

if ($nameToUrl.Count -eq 0) {
    throw "URL map is empty. Run npm run kie:upload-src or fix -PublicBaseUrl."
}

$API_KEY = Get-KieApiKey
$BASE_URL = "https://api.kie.ai"
$headers = @{ Authorization = "Bearer $API_KEY"; "Content-Type" = "application/json" }

if (-not (Test-Path $AD_JSON)) {
    throw "Missing $AD_JSON - copy bundled with scripts."
}
# ConvertFrom-Json can return Object[] nested as a single-element array ; force flat list:
$parsed = Get-Content $AD_JSON -Raw -Encoding UTF8 | ConvertFrom-Json
$copyLines = @($parsed | ForEach-Object { $_ })

$locals = @(Get-ChildItem -LiteralPath $SRC_DIR -File | Where-Object {
        $_.Name -match '\.(jpg|jpeg|png|webp)$' -and $_.Name -notmatch '^kie-(image-urls|blob-urls)\.json$'
    } | Sort-Object Name)

$ordered = foreach ($f in $locals) {
    $u = $nameToUrl[$f.Name]
    if (-not $u) {
        Write-Warning "No URL for $($f.Name) in $($mapPathUsed) - run npm run kie:upload-src."
        continue
    }
    @{ Name = $f.Name; Url = [string]$u }
}

if ($ordered.Count -eq 0) {
    throw "No image URLs matched files in src/. Run npm run kie:upload-src."
}

$layoutLooks = @(
    "Ultra-thin gold hairline geometric frame overlapping one edge",
    "Soft black-to-transparent corner vignettes with serif headline stripe",
    "Magazine-cover split: typography block occupying top third only",
    "Bold condensed sans serif with oversized numerals motif (reserved year slot)",
    "Minimal Swiss grid: asymmetric white space plus single gold underline",
    "Film-poster noir: faint grain overlay, narrow letterboxed title strip",
    "Brush-texture matte black band behind headline bar",
    "Circular gold seal motif echoing logo shape without cloning it",
    "Diagonal gold foil accent bar from bottom corner",
    "Art-deco stepped corners framing text only - photo untouched underneath",
    "Duotone veil limited to typography mask only - subject colors preserved",
    "Postcard serif script accent for subtitle only",
    "Neon-soft outline text but low opacity - mostly gold on black typography",
    "Editorial collage: small duplicate logo chip top-left beside headline",
    "Vertical ribbon tag for bilingual microcopy",
    "Gradient mesh behind text ONLY (multiply blend) preserving food colours",
    "Stamped emboss effect on headline letters only",
    "Arched typography following top curve - cinematic food poster",
    "Bottom third solid black matte bar reserved for subtitles",
    "Micro-pattern Arabesque line art as faint watermark behind type"
)

$aspectPool = @("1:1", "4:5", "4:5", "9:16", "16:9")

Write-Host "Building $Total Kie tasks (~50 website-clean + ~50 ad overlays) ..." -ForegroundColor Cyan
Write-Host ("Sources: " + $ordered.Count + " base photos (kie-image-urls or public HTTPS).") -ForegroundColor DarkGray

$prompts = @()
for ([int]$i = 0; $i -lt $Total; $i++) {
    $src = $ordered[$i % $ordered.Count]
    $ratio = $aspectPool[$i % $aspectPool.Count]
    $slug = [IO.Path]::GetFileNameWithoutExtension($src.Name)
    $isAd = ($i % 2) -eq 1

    if (-not $isAd) {
        $name = ("{0:D3}-web-{1}" -f ($i + 1), $slug)
        $p = @"
REFERENCE (image 1): This is the ONLY photograph. Preserve it EXACTLY as captured: same framing, perspective, subjects, dishes, interior or exterior details, colours, shadows, noise, and imperfections. Do NOT replace, add, or remove objects. Do NOT restyle as illustration or CGI. Do NOT change ingredient appearance or architecture.

ONLY allowed: (a) optional subtle global micro-contrast or mild clarity if the file is visibly soft, (b) add the Casa Fenicia Lebanese Bistro circular gold-on-black logo from image 2 as a small tasteful badge in ONE corner (about 6-9% of frame width) with soft shadow, never blocking the hero subject.

No marketing text, no filters that alter mood. Output must read as the same real photo with a discreet brand mark.
"@
        $prompts += @{ Name = $name; Ratio = $ratio; Refs = @($src.Url, $LogoUrl); Prompt = $p }
    }
    else {
        $c = $copyLines[$i % $copyLines.Count]
        $look = $layoutLooks[($i * 11) % $layoutLooks.Count]
        $laneSlug = "$($c.lane)"
        $name = ("{0:D3}-ad-{1}-{2}" -f ($i + 1), $laneSlug, $slug)
        $lane = $laneSlug.ToUpperInvariant()

        $p = @"
BASE PHOTOGRAPH (image 1): Preserve the SAME real-world scene faithfully - identical food dishes, plating, storefront, signage, interiors, people's presence (if any), geometry, reflections, textures, palette, lighting direction and mood. Forbidden: swapping the dish/building/subject with a generic stock substitute, hallucinating props, widening/lengthening the plate, or over-perfecting away authentic details. The photograph remains the hero.

CREATIVE AD LAYER (graphics + type only): Build a UNIQUE premium marketing layout - $look. Integrate the Casa Fenicia ship logo from image 2 (gold on black) as a designed element (not a cheap sticker over the food).

TYPOGRAPHY - language lane $lane : Primary headline must display EXACTLY this text: $($c.prim)
Secondary line must display EXACTLY: $($c.sec)
Use correct spelling and script for that lane (Latin for ES/EN, Arabic script for AR). Text must be crisp, high contrast, legible, and must not cover the focal food or main subject - place in negative space or dedicated bands.

Black, gold, and warm white only for graphic elements. High-end Lebanese bistro / Mediterranean restaurant campaign quality. Each output should feel visually distinct from generic templates.
"@
        $prompts += @{ Name = $name; Ratio = $ratio; Refs = @($src.Url, $LogoUrl); Prompt = $p }
    }
}

Write-Host "Submitting $($prompts.Count) tasks to $Model ..." -ForegroundColor Cyan

$tasks = @()
foreach ($item in $prompts) {
    $inputObj = @{
        prompt        = $item.Prompt
        aspect_ratio  = $item.Ratio
        resolution    = "2K"
        output_format = "jpg"
        image_input   = $item.Refs
    }

    $body = @{
        model = $Model
        input = $inputObj
    } | ConvertTo-Json -Depth 8

    try {
        $r = Invoke-RestMethod -Uri "$BASE_URL/api/v1/jobs/createTask" -Method POST -Headers $headers -Body $body
        if ($r.code -eq 200) {
            $tasks += @{ taskId = $r.data.taskId; name = $item.Name }
            Write-Host ("  [{0}] {1}" -f $item.Name, $r.data.taskId) -ForegroundColor Green
        }
        else {
            Write-Host ("  [{0}] submit fail: {1}" -f $item.Name, $r.msg) -ForegroundColor Red
        }
    }
    catch {
        Write-Host ("  [{0}] ERROR {1}" -f $item.Name, $_) -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 450
}

Write-Host "`nPolling $($tasks.Count) jobs (long run for 100 images) ..." -ForegroundColor Cyan
$done = @{}
$maxWaitSec = 9000   # ~2.5 h safety margin for large batches
$elapsed = 0
$poll = 12

while ($done.Count -lt $tasks.Count -and $elapsed -lt $maxWaitSec) {
    Start-Sleep -Seconds $poll
    $elapsed += $poll

    foreach ($t in $tasks) {
        if ($done.ContainsKey($t.taskId)) { continue }

        try {
            $r = Invoke-RestMethod -Uri "$BASE_URL/api/v1/jobs/recordInfo?taskId=$($t.taskId)" -Method GET -Headers $headers
            $state = $r.data.state

            if ($state -eq "success") {
                $result = $r.data.resultJson | ConvertFrom-Json
                $url = $result.resultUrls[0]
                $outPath = Join-Path $OUT_DIR ("{0}.jpg" -f $t.name)
                Invoke-WebRequest -Uri $url -OutFile $outPath
                $done[$t.taskId] = $true
                Write-Host ("  saved {0}" -f $t.name) -ForegroundColor Green
            }
            elseif ($state -eq "fail") {
                $done[$t.taskId] = $true
                Write-Host ("  FAIL {0}: {1}" -f $t.name, $r.data.failMsg) -ForegroundColor Red
            }
        }
        catch {
            # transient - keep polling
        }
    }

    $remain = $tasks.Count - $done.Count
    if ($remain -gt 0) {
        Write-Host ("  [{0}s] {1} pending ..." -f $elapsed, $remain) -ForegroundColor DarkGray
    }
}

Write-Host "`nFinished. Saved $($done.Count) / $($tasks.Count) images under public/ai-images/$OutDirName/" -ForegroundColor Cyan
