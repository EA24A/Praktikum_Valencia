#!/usr/bin/env pwsh
# Process food photos with GPT Image 2 (gpt-image-1)
# - Remove background (keep food+plate+placemat)
# - Replace table with pitch black
# - Add Casa Fenicia logo to bottom right corner

param(
    [string]$ApiKey = "",
    [string]$OutDirName = "processed-food"
)

$ErrorActionPreference = "Stop"
$PSScriptParent = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $PSScriptParent
$ASSETS_DIR = "C:\Users\Martin\.cursor\projects\c-Users-Martin-Desktop-casafenicia\assets"
$OUT_DIR = Join-Path $PROJECT_ROOT "public\ai-images\$OutDirName"
$LOGO_PATH = Join-Path $PROJECT_ROOT "public\ref\logo.png"

function Get-OpenAIApiKey {
    if ($ApiKey -and $ApiKey.Trim()) { return $ApiKey.Trim() }
    if ($env:OPENAI_API_KEY -and $env:OPENAI_API_KEY.Trim()) { return $env:OPENAI_API_KEY.Trim() }

    $envFile = Join-Path $PROJECT_ROOT ".env.local"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        $match = [regex]::Match($content, 'OPENAI_API_KEY\s*=\s*"?([^"\r\n]+)"?')
        if ($match.Success) { return $match.Groups[1].Value.Trim() }
    }

    $envFile2 = Join-Path $PROJECT_ROOT ".env"
    if (Test-Path $envFile2) {
        $content = Get-Content $envFile2 -Raw
        $match = [regex]::Match($content, 'OPENAI_API_KEY\s*=\s*"?([^"\r\n]+)"?')
        if ($match.Success) { return $match.Groups[1].Value.Trim() }
    }

    throw "OpenAI API key not found. Set OPENAI_API_KEY env var or add to .env.local"
}

# Create output directory
New-Item -ItemType Directory -Force $OUT_DIR | Out-Null

# Get all the uploaded food images
$sourceImages = Get-ChildItem -LiteralPath $ASSETS_DIR -File | Where-Object {
    $_.Name -match 'photo_\d+_2026-05-11.*\.png$'
} | Sort-Object Name

if ($sourceImages.Count -eq 0) {
    throw "No source images found in $ASSETS_DIR"
}

Write-Host "Found $($sourceImages.Count) food photos to process" -ForegroundColor Cyan
Write-Host "Output directory: $OUT_DIR" -ForegroundColor DarkGray
Write-Host "Logo: $LOGO_PATH" -ForegroundColor DarkGray

# Verify logo exists
if (-not (Test-Path $LOGO_PATH)) {
    throw "Logo not found at $LOGO_PATH"
}

$API_KEY = Get-OpenAIApiKey

# Prompt for image editing
$EDIT_PROMPT = @"Transform this food photo:

1. BACKGROUND: Remove the dark table completely and replace with PURE PITCH BLACK (#000000) background

2. PRESERVE EXACTLY: Keep the food, plates, bowls, glasses, and woven circular beige placemat - same position, lighting, colors, texture

3. LOGO: Add the Casa Fenicia logo to bottom right corner, small (8-10% width), elegant, subtle shadow, not blocking food

4. RESULT: Professional restaurant marketing photo with dramatic black background

CRITICAL: Do NOT change food appearance, colors, or arrangement. Only change background to black and add logo.
"@

# Process each image
$processed = 0
$failed = 0

foreach ($img in $sourceImages) {
    $baseName = [IO.Path]::GetFileNameWithoutExtension($img.Name)
    $outFile = Join-Path $OUT_DIR "$baseName-processed.png"

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "[$($processed + 1)/$($sourceImages.Count)] Processing: $($img.Name)" -ForegroundColor Cyan

    try {
        # Create temp files for curl
        $tempPrompt = Join-Path $env:TEMP "prompt_$($baseName).txt"
        $EDIT_PROMPT | Out-File -FilePath $tempPrompt -Encoding UTF8 -NoNewline

        # Build curl command using curl.exe to avoid PowerShell alias
        $curlCmd = "curl.exe"
        $curlArgs = @(
            "-s", "-X", "POST",
            "https://api.openai.com/v1/images/generations",
            "-H", "Authorization: Bearer $API_KEY",
            "-F", "model=gpt-image-1",
            "-F", "prompt=@`"$tempPrompt`"",
            "-F", "image=@`"$($img.FullName)`";type=image/png",
            "-F", "logo=@`"$LOGO_PATH`";type=image/png",
            "--max-time", "180"
        )

        Write-Host "  Calling OpenAI gpt-image-1 API..." -ForegroundColor DarkGray
        Write-Host "  (This may take up to 2 minutes per image)" -ForegroundColor DarkGray

        $responseJson = & $curlCmd @curlArgs 2>&1

        # Clean up temp file
        Remove-Item $tempPrompt -ErrorAction SilentlyContinue

        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Curl error: $responseJson" -ForegroundColor Red
            $failed++
            continue
        }

        $response = $responseJson | ConvertFrom-Json

        if ($response.error) {
            Write-Host "  API Error: $($response.error.message)" -ForegroundColor Red
            $failed++
            continue
        }

        # Save the result
        if ($response.data -and $response.data[0].b64_json) {
            $bytes = [Convert]::FromBase64String($response.data[0].b64_json)
            [System.IO.File]::WriteAllBytes($outFile, $bytes)
            $processed++
            Write-Host "  SUCCESS: Saved to $outFile" -ForegroundColor Green
        } elseif ($response.data -and $response.data[0].url) {
            Invoke-WebRequest -Uri $response.data[0].url -OutFile $outFile
            $processed++
            Write-Host "  SUCCESS: Saved to $outFile" -ForegroundColor Green
        } else {
            Write-Host "  Unexpected response format" -ForegroundColor Red
            Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor DarkGray
            $failed++
        }

        # Rate limiting
        Start-Sleep -Seconds 3

    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DONE!" -ForegroundColor Cyan
Write-Host "Processed: $processed / $($sourceImages.Count)" -ForegroundColor Green
if ($failed -gt 0) { Write-Host "Failed: $failed" -ForegroundColor Red }
Write-Host "Output folder: $OUT_DIR" -ForegroundColor Cyan

# Also add npm script entry if Node.js version preferred
Write-Host "`nAlternative: Run 'node scripts/process-food-photos.js' (requires: npm install form-data)" -ForegroundColor DarkGray
