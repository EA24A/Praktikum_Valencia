#!/usr/bin/env pwsh
# Process food photos via Kie AI (nano-banana-pro)
# - Uploads photos from cursor assets to Kie (to get blob URLs)
# - Removes background (keeps food+plate+placemat)
# - Replaces table with pitch black
# - Adds Casa Fenicia logo to bottom right

param(
    [string]$ApiKey = "",
    [string]$OutDirName = "processed-food",
    [string]$LogoUrl = "https://casafenicia.vercel.app/ref/logo.png"
)

$ErrorActionPreference = "Stop"
$PSScriptParent = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $PSScriptParent
$ASSETS_DIR = "C:\Users\Martin\.cursor\projects\c-Users-Martin-Desktop-casafenicia\assets"
$OUT_DIR = Join-Path $PROJECT_ROOT "public\ai-images\$OutDirName"
$URL_MAP_FILE = Join-Path $OUT_DIR "kie-blob-urls.json"

$KIE_UPLOAD_BASE = "https://kieai.redpandaai.co"
$KIE_STREAM_UPLOAD = "$KIE_UPLOAD_BASE/api/file-stream-upload"
$KIE_JOBS_BASE = "https://api.kie.ai"

function Get-KieApiKey {
    if ($ApiKey -and $ApiKey.Trim()) { return $ApiKey.Trim() }
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
    throw "Set KIE_API_KEY env var, add to .env.local, or ensure key exists in generate-realistic.ps1"
}

$API_KEY = Get-KieApiKey

New-Item -ItemType Directory -Force $OUT_DIR | Out-Null

# Get source images
$sourceImages = Get-ChildItem -LiteralPath $ASSETS_DIR -File | Where-Object {
    $_.Name -match 'photo_\d+_2026-05-11.*\.png$'
} | Sort-Object Name

if ($sourceImages.Count -eq 0) {
    throw "No source images found in $ASSETS_DIR"
}

Write-Host "Found $($sourceImages.Count) food photos to process" -ForegroundColor Cyan
Write-Host "Output: $OUT_DIR" -ForegroundColor DarkGray

# Step 1: Upload images to Kie to get blob URLs
Write-Host "`nStep 1: Uploading images to Kie for blob URLs..." -ForegroundColor Cyan

$nameToUrl = @{}
$uploadPath = "casafenicia-food"

foreach ($img in $sourceImages) {
    Write-Host "  Uploading $($img.Name)..." -ForegroundColor DarkGray -NoNewline

    try {
        # Read file
        $bytes = [System.IO.File]::ReadAllBytes($img.FullName)
        $fileName = $img.Name

        # Create multipart form boundary
        $boundary = [Guid]::NewGuid().ToString()
        $headers = @{
            "Authorization" = "Bearer $API_KEY"
        }

        # Build multipart body
        $crlf = "`r`n"
        $bodyParts = @(
            "--$boundary$crlf",
            "Content-Disposition: form-data; name=`"uploadPath`"$crlf$crlf",
            "$uploadPath$crlf",
            "--$boundary$crlf",
            "Content-Disposition: form-data; name=`"fileName`"$crlf$crlf",
            "$fileName$crlf",
            "--$boundary$crlf",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"$crlf",
            "Content-Type: image/png$crlf$crlf"
        )

        $headerBytes = [System.Text.Encoding]::UTF8.GetBytes(-join $bodyParts)
        $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("$crlf--$boundary--$crlf")

        $fullBody = New-Object byte[] ($headerBytes.Length + $bytes.Length + $footerBytes.Length)
        [System.Buffer]::BlockCopy($headerBytes, 0, $fullBody, 0, $headerBytes.Length)
        [System.Buffer]::BlockCopy($bytes, 0, $fullBody, $headerBytes.Length, $bytes.Length)
        [System.Buffer]::BlockCopy($footerBytes, 0, $fullBody, ($headerBytes.Length + $bytes.Length), $footerBytes.Length)

        $headers["Content-Type"] = "multipart/form-data; boundary=$boundary"

        # Upload
        $response = Invoke-RestMethod -Uri $KIE_STREAM_UPLOAD -Method POST -Headers $headers -Body $fullBody

        # Extract download URL
        $downloadUrl = $response.data.downloadUrl
        if (-not $downloadUrl) { $downloadUrl = $response.data.fileUrl }
        if (-not $downloadUrl) { $downloadUrl = $response.downloadUrl }
        if (-not $downloadUrl) { $downloadUrl = $response.fileUrl }

        if ($downloadUrl) {
            $nameToUrl[$img.Name] = $downloadUrl
            Write-Host " OK -> $([Uri]$downloadUrl).Host/..." -ForegroundColor Green
        } else {
            Write-Host " FAILED (no URL in response)" -ForegroundColor Red
            Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor DarkGray
        }

        Start-Sleep -Milliseconds 450

    } catch {
        Write-Host " FAILED: $_" -ForegroundColor Red
    }
}

if ($nameToUrl.Count -eq 0) {
    throw "No images were successfully uploaded"
}

# Save URL map
$nameToUrl | ConvertTo-Json | Out-File $URL_MAP_FILE -Encoding UTF8
Write-Host "Uploaded $($nameToUrl.Count) images. URLs saved to $URL_MAP_FILE" -ForegroundColor Green

# Step 2: Submit generation tasks
Write-Host "`nStep 2: Submitting image editing tasks to Kie..." -ForegroundColor Cyan

$headers = @{ "Authorization" = "Bearer $API_KEY"; "Content-Type" = "application/json" }

$tasks = @()

$basePrompt = @"
Transform this food photo:

BACKGROUND: Remove the dark table/wooden surface completely and replace with PURE PITCH BLACK (#000000) background. The black must be uniform and dramatic.

PRESERVE: Keep the food, plates, bowls, glasses, and woven circular beige placemat EXACTLY as photographed - same position, lighting, colors, texture.

LOGO: Add the Casa Fenicia gold ship logo (image 2) to bottom right corner. Small and elegant (~8-10% width), with margin from edges, subtle shadow. Must NOT obstruct food.

RESULT: Professional Lebanese restaurant marketing photo with dramatic black background and tasteful branding. Do NOT alter food appearance.
"@

foreach ($img in $sourceImages) {
    $baseName = [IO.Path]::GetFileNameWithoutExtension($img.Name)
    $outFile = Join-Path $OUT_DIR "$baseName-processed.jpg"

    $imageUrl = $nameToUrl[$img.Name]
    if (-not $imageUrl) {
        Write-Host "  [SKIP] No URL for $($img.Name)" -ForegroundColor Yellow
        continue
    }

    Write-Host "  Submitting: $($img.Name)" -ForegroundColor DarkGray -NoNewline

    try {
        $body = @{
            model = "nano-banana-pro"
            input = @{
                prompt = $basePrompt
                aspect_ratio = "1:1"
                resolution = "2K"
                output_format = "jpg"
                image_input = @($imageUrl, $LogoUrl)
            }
        } | ConvertTo-Json -Depth 5

        $response = Invoke-RestMethod -Uri "$KIE_JOBS_BASE/api/v1/jobs/createTask" -Method POST -Headers $headers -Body $body

        if ($response.code -eq 200) {
            $tasks += @{
                taskId = $response.data.taskId
                name = $baseName
                outFile = $outFile
                originalName = $img.Name
            }
            Write-Host " TaskId: $($response.data.taskId)" -ForegroundColor Green
        } else {
            Write-Host " FAILED: $($response.msg)" -ForegroundColor Red
        }

        Start-Sleep -Milliseconds 500

    } catch {
        Write-Host " ERROR: $_" -ForegroundColor Red
    }
}

if ($tasks.Count -eq 0) {
    throw "No tasks were successfully submitted"
}

# Step 3: Poll for results
Write-Host "`nStep 3: Polling $($tasks.Count) tasks..." -ForegroundColor Cyan
Write-Host "  (This may take 5-15 minutes - images are being generated)" -ForegroundColor DarkGray

$done = @{}
$processed = 0
$failed = 0
$maxWait = 1800  # 30 minutes
$elapsed = 0
$pollInterval = 15

while ($done.Count -lt $tasks.Count -and $elapsed -lt $maxWait) {
    Start-Sleep -Seconds $pollInterval
    $elapsed += $pollInterval

    foreach ($t in $tasks) {
        if ($done.ContainsKey($t.taskId)) { continue }

        try {
            $r = Invoke-RestMethod -Uri "$KIE_JOBS_BASE/api/v1/jobs/recordInfo?taskId=$($t.taskId)" -Method GET -Headers $headers
            $state = $r.data.state

            if ($state -eq "success") {
                $result = $r.data.resultJson | ConvertFrom-Json
                $url = $result.resultUrls[0]
                Invoke-WebRequest -Uri $url -OutFile $t.outFile
                $done[$t.taskId] = $true
                $processed++
                Write-Host "  [SAVED] $($t.originalName) -> $($t.name)-processed.jpg" -ForegroundColor Green
            } elseif ($state -eq "fail") {
                $done[$t.taskId] = $true
                $failed++
                Write-Host "  [FAILED] $($t.originalName): $($r.data.failMsg)" -ForegroundColor Red
            }
        } catch {
            # transient, keep polling
        }
    }

    $remaining = $tasks.Count - $done.Count
    if ($remaining -gt 0 -and ($elapsed % 60 -eq 0)) {
        Write-Host "  [${elapsed}s elapsed] $remaining still processing..." -ForegroundColor DarkGray
    }
}

# Final summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DONE!" -ForegroundColor Cyan
Write-Host "Successfully processed: $processed / $($sourceImages.Count)" -ForegroundColor Green
if ($failed -gt 0) { Write-Host "Failed: $failed" -ForegroundColor Red }
Write-Host "Output folder: $OUT_DIR" -ForegroundColor Cyan
Write-Host "`nNote: Kie blob URLs expire in ~3 days. The processed images are saved locally." -ForegroundColor DarkGray
