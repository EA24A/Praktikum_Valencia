#!/usr/bin/env pwsh
# Process food photos with GPT Image 2 (gpt-image-1)
# - Remove background (keep food+plate+placemat)
# - Replace table with pitch black
# - Add Casa Fenicia logo to bottom right corner

param(
    [string]$ApiKey = "",
    [string]$OutDirName = "processed-food",
    [string]$LogoPath = "public/ref/logo.png"
)

$ErrorActionPreference = "Stop"
$PSScriptParent = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $PSScriptParent
$ASSETS_DIR = "C:\Users\Martin\.cursor\projects\c-Users-Martin-Desktop-casafenicia\assets"
$OUT_DIR = Join-Path $PROJECT_ROOT "public\ai-images\$OutDirName"
$LOCAL_LOGO = Join-Path $PROJECT_ROOT $LogoPath

# OpenAI API endpoint
$OPENAI_API_URL = "https://api.openai.com/v1/images/generations"

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

# Verify logo exists
if (-not (Test-Path $LOCAL_LOGO)) {
    throw "Logo not found at $LOCAL_LOGO"
}
Write-Host "Using logo: $LOCAL_LOGO" -ForegroundColor DarkGray

$API_KEY = Get-OpenAIApiKey

# Prompt for image editing
$editPrompt = @"Transform this food photograph with the following edits:

1. BACKGROUND REPLACEMENT: Remove the dark wooden/black table surface completely and replace it with pure pitch black (#000000). The black background should be completely uniform.

2. PRESERVE: Keep the food, plates, bowls, glasses, and the woven circular beige/cream placemat EXACTLY as they appear - same position, lighting, colors, and texture.

3. LOGO ADDITION: Add the Casa Fenicia logo to the bottom right corner. The logo should be:
   - Small and tasteful (approximately 8-10% of image width)
   - Positioned in the bottom right with some margin from edges
   - Have a subtle drop shadow for depth
   - Not overlapping or obstructing any food or plates

4. FINAL LOOK: The result should look like a professional restaurant marketing photo with dramatic black background, showcasing the food beautifully with subtle branding.

Do NOT change the food presentation, colors, or arrangement. Keep everything exactly as photographed, only change the background to black and add the logo.
"@

# Process each image
$processed = 0
$failed = 0

foreach ($img in $sourceImages) {
    $baseName = [IO.Path]::GetFileNameWithoutExtension($img.Name)
    $outFile = Join-Path $OUT_DIR "$baseName-processed.png"

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Processing ($($processed + 1)/$($sourceImages.Count)): $($img.Name)" -ForegroundColor Cyan

    try {
        # Create multipart form data
        $boundary = [Guid]::NewGuid().ToString()
        $headers = @{
            "Authorization" = "Bearer $API_KEY"
        }

        # Build multipart body
        $bodyLines = @(
            "--$boundary"
            "Content-Disposition: form-data; name=`"model`""
            ""
            "gpt-image-1"
            "--$boundary"
            "Content-Disposition: form-data; name=`"prompt`""
            ""
            $editPrompt
            "--$boundary"
            "Content-Disposition: form-data; name=`"image`"; filename=`"$($img.Name)`""
            "Content-Type: image/png"
            ""
        )

        # Read and encode image
        $imageBytes = [System.IO.File]::ReadAllBytes($img.FullName)
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes(($bodyLines -join "`r`n") + "`r`n")

        # Add image bytes
        $fullBody = New-Object byte[] ($bodyBytes.Length + $imageBytes.Length + 2)
        [Array]::Copy($bodyBytes, 0, $fullBody, 0, $bodyBytes.Length)
        [Array]::Copy($imageBytes, 0, $fullBody, $bodyBytes.Length, $imageBytes.Length)
        [Array]::Copy([System.Text.Encoding]::UTF8.GetBytes("`r`n"), 0, $fullBody, $bodyBytes.Length + $imageBytes.Length, 2)

        # Add logo as additional reference
        $logoBytes = [System.IO.File]::ReadAllBytes($LOCAL_LOGO)
        $logoHeader = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary`r`nContent-Disposition: form-data; name=`"logo`"; filename=`"logo.png`"`r`nContent-Type: image/png`r`n`r`n")
        $footer = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")

        $finalBody = New-Object byte[] ($fullBody.Length + $logoHeader.Length + $logoBytes.Length + $footer.Length)
        [Array]::Copy($fullBody, 0, $finalBody, 0, $fullBody.Length)
        [Array]::Copy($logoHeader, 0, $finalBody, $fullBody.Length, $logoHeader.Length)
        [Array]::Copy($logoBytes, 0, $finalBody, $fullBody.Length + $logoHeader.Length, $logoBytes.Length)
        [Array]::Copy($footer, 0, $finalBody, $fullBody.Length + $logoHeader.Length + $logoBytes.Length, $footer.Length)

        $headers["Content-Type"] = "multipart/form-data; boundary=$boundary"

        Write-Host "  Sending to OpenAI gpt-image-1..." -ForegroundColor DarkGray

        $response = Invoke-RestMethod -Uri $OPENAI_API_URL -Method POST -Headers $headers -Body $finalBody -TimeoutSec 180

        # Save the generated image
        if ($response.data -and $response.data[0].url) {
            Invoke-WebRequest -Uri $response.data[0].url -OutFile $outFile
            $processed++
            Write-Host "  SUCCESS: Saved to $outFile" -ForegroundColor Green
        } elseif ($response.data -and $response.data[0].b64_json) {
            $outputBytes = [Convert]::FromBase64String($response.data[0].b64_json)
            [System.IO.File]::WriteAllBytes($outFile, $outputBytes)
            $processed++
            Write-Host "  SUCCESS: Saved to $outFile" -ForegroundColor Green
        } else {
            Write-Host "  Unexpected response format:" -ForegroundColor Red
            Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray
            $failed++
        }

        # Rate limiting
        Start-Sleep -Seconds 3

    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "  API Error: $errorBody" -ForegroundColor Red
        }
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DONE!" -ForegroundColor Cyan
Write-Host "Processed: $processed / $($sourceImages.Count)" -ForegroundColor Green
if ($failed -gt 0) { Write-Host "Failed: $failed" -ForegroundColor Red }
Write-Host "Output folder: $OUT_DIR" -ForegroundColor Cyan
