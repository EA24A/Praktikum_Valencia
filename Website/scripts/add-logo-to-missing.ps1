$API_KEY  = "16dfa559457c9463573192feea84ecdf"
$BASE_URL = "https://api.kie.ai"
$OUT_DIR  = "$PSScriptRoot\..\public\ai-images\menu-items"
$headers  = @{ "Authorization" = "Bearer $API_KEY"; "Content-Type" = "application/json" }

New-Item -ItemType Directory -Force $OUT_DIR | Out-Null

$LOGO = "https://casafenicia.vercel.app/ref/logo.png"

# Consistent style note injected in every prompt:
# "Casa Fenicia Lebanese Bistro Cafe circular gold logo badge placed in the bottom-right corner"
# This matches the style of kibbeh/sfiha/hummus-clasico images.

$prompts = @(
  @{ name="baba-ghanoush"; ratio="4:3"; refs=@($LOGO);
     prompt="Studio food photography of Lebanese baba ghanoush, smoky roasted eggplant dip with olive oil drizzle, pomegranate seeds and fresh mint leaves, served in a rustic dark ceramic dish, moody black background with warm spotlight, professional culinary photography, top-down view, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="shawarma-de-pollo"; ratio="4:3"; refs=@($LOGO);
     prompt="Studio food photography of a Lebanese chicken shawarma wrap, golden pita bread tightly wrapped around sliced marinated chicken with garlic sauce, fresh vegetables and pickles visible at the opening, served on dark parchment on a black surface, moody warm lighting, professional culinary photography, slight angle shot, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="kafta"; ratio="4:3"; refs=@($LOGO);
     prompt="Studio food photography of Lebanese kafta, grilled spiced ground lamb skewers charred to perfection with grill marks, served on a dark board with grilled tomatoes, onion rings and flat parsley, moody dark background with warm fire-like lighting, professional culinary photography, slight angle, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="cafe-arabe"; ratio="3:4"; refs=@($LOGO);
     prompt="Studio drink photography of traditional Arabic coffee served in a small ornate gold-rimmed glass beside an elegant dark ceramic dallah coffee pot, orange blossom petals as garnish, dark moody black background with warm golden bokeh, professional beverage photography, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="te-de-menta"; ratio="3:4"; refs=@($LOGO);
     prompt="Studio drink photography of mint tea poured from a traditional ornate silver teapot into a small gold-rimmed glass, steam rising, fresh mint leaves in the glass, dark moody black background with warm golden side lighting, professional beverage photography, three-quarter angle, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="knafeh"; ratio="4:3"; refs=@($LOGO);
     prompt="Studio food photography of knafeh, a warm cheese-filled shredded wheat pastry soaked in orange blossom sugar syrup, topped with crushed pistachios and a rose petal, served in a dark copper dish, moody black background with warm amber lighting, melting cheese visible at the cut edge, professional culinary photography, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="pollo-a-la-brasa"; ratio="4:3"; refs=@($LOGO);
     prompt="Studio food photography of Lebanese grilled chicken, half a golden rotisserie chicken with crispy skin and char marks, served with garlic toum sauce and lemon wedge on a dark ceramic plate, moody black background with warm spotlight, professional culinary photography, three-quarter angle, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="limonada-menta"; ratio="3:4"; refs=@($LOGO);
     prompt="Studio drink photography of Lebanese mint lemonade, a tall clear glass filled with bright yellow lemonade, crushed ice, fresh mint leaves and lemon slices, dark moody background with a subtle golden rim light, condensation on the glass, professional beverage photography, three-quarter angle, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="ayran"; ratio="3:4"; refs=@($LOGO);
     prompt="Studio drink photography of ayran yogurt drink in a traditional copper cup, frothy white top with a sprinkle of dried mint, dark moody black background with warm amber lighting, condensation on the cup, professional beverage photography, slightly elevated angle, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="helado-almendra"; ratio="3:4"; refs=@($LOGO);
     prompt="Studio food photography of artisan almond and rose water ice cream scoops in a dark waffle cone, dusted with crushed pistachios and dried rose petals, dark moody black background with soft golden rim light, professional dessert photography, slightly elevated three-quarter angle, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." },

  @{ name="mamoul"; ratio="4:3"; refs=@($LOGO);
     prompt="Studio food photography of Lebanese mamoul cookies, round shortbread cookies filled with dates and walnuts, lightly dusted with powdered sugar, arranged on a dark ceramic plate with rose petals, moody black background with warm golden light, professional culinary photography, top-down, highly realistic, 8K. Casa Fenicia Lebanese Bistro Cafe circular gold-on-black logo badge overlaid in the bottom-right corner of the image." }
)

Write-Host "Submitting $($prompts.Count) logo-enhanced images..." -ForegroundColor Cyan

$tasks = @()
foreach ($p in $prompts) {
  $inputObj = @{
    prompt        = $p.prompt
    aspect_ratio  = $p.ratio
    resolution    = "2K"
    output_format = "jpg"
    image_input   = $p.refs
  }

  $body = @{
    model = "nano-banana-pro"
    input = $inputObj
  } | ConvertTo-Json -Depth 5

  try {
    $r = Invoke-RestMethod -Uri "$BASE_URL/api/v1/jobs/createTask" -Method POST -Headers $headers -Body $body
    if ($r.code -eq 200) {
      $tasks += @{ taskId = $r.data.taskId; name = $p.name }
      Write-Host "  [$($p.name)] submitted: $($r.data.taskId)" -ForegroundColor Green
    } else {
      Write-Host "  [$($p.name)] FAILED to submit: $($r.msg)" -ForegroundColor Red
    }
  } catch {
    Write-Host "  [$($p.name)] ERROR: $_" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 400
}

Write-Host "`nPolling $($tasks.Count) tasks..." -ForegroundColor Cyan
$done    = @{}
$maxWait = 900
$elapsed = 0

while ($done.Count -lt $tasks.Count -and $elapsed -lt $maxWait) {
  Start-Sleep -Seconds 10
  $elapsed += 10
  foreach ($t in $tasks) {
    if ($done.ContainsKey($t.taskId)) { continue }
    try {
      $r     = Invoke-RestMethod -Uri "$BASE_URL/api/v1/jobs/recordInfo?taskId=$($t.taskId)" -Method GET -Headers $headers
      $state = $r.data.state
      if ($state -eq "success") {
        $result  = $r.data.resultJson | ConvertFrom-Json
        $url     = $result.resultUrls[0]
        $outPath = Join-Path $OUT_DIR "$($t.name).jpg"
        Invoke-WebRequest -Uri $url -OutFile $outPath
        $done[$t.taskId] = $true
        Write-Host "  [$($t.name)] SAVED" -ForegroundColor Green
      } elseif ($state -eq "fail") {
        $done[$t.taskId] = $true
        Write-Host "  [$($t.name)] FAILED: $($r.data.failMsg)" -ForegroundColor Red
      }
    } catch { }
  }
  $remaining = $tasks.Count - $done.Count
  if ($remaining -gt 0) { Write-Host "  [${elapsed}s] $remaining remaining..." -ForegroundColor DarkGray }
}

Write-Host "`nDone! $($done.Count)/$($tasks.Count) saved to public/ai-images/menu-items/" -ForegroundColor Cyan
