$API_KEY  = "16dfa559457c9463573192feea84ecdf"
$BASE_URL = "https://api.kie.ai"
$OUT_DIR  = "$PSScriptRoot\..\public\ai-images-realistic"
$headers  = @{ "Authorization" = "Bearer $API_KEY"; "Content-Type" = "application/json" }

New-Item -ItemType Directory -Force $OUT_DIR | Out-Null

# GitHub raw URLs for reference images (live after push)
$LOGO       = "https://casafenicia.vercel.app/ref/logo.png"
$STORE1     = "https://casafenicia.vercel.app/ref/storefront1.png"
$STORE2     = "https://casafenicia.vercel.app/ref/storefront2.png"
$ICECREAM   = "https://casafenicia.vercel.app/ref/icecream.png"
$WRAPS      = "https://casafenicia.vercel.app/ref/wraps.png"

$prompts = @(
  # ── Storefront / exterior ─────────────────────────────────────────────────
  @{ name="r01-storefront-day";    ratio="4:3";  refs=@($STORE1,$LOGO);
     prompt="Photograph of the Casa Fenicia Lebanese Bistro Cafe storefront during daytime, same real black facade with gold lettering and ship logo sign as in the reference, sunny Valencia Spain cobblestone street, people passing by, warm sunlight, editorial travel photography style, highly realistic" },

  @{ name="r02-storefront-evening"; ratio="4:3"; refs=@($STORE1,$LOGO);
     prompt="The same Casa Fenicia restaurant storefront from the reference photo at dusk, golden hour warm light glowing through the window, a couple walking past, atmospheric evening street photography, Valencia Spain old town, highly realistic" },

  @{ name="r03-storefront-wide"; ratio="16:9"; refs=@($STORE2,$LOGO);
     prompt="Wide shot of Casa Fenicia restaurant entrance on Valencia cobblestone street, same black and gold storefront signage as in reference, charming narrow street, Mediterranean architecture, summer evening, lifestyle photography, realistic" },

  @{ name="r04-logo-on-wall"; ratio="1:1"; refs=@($LOGO);
     prompt="The Casa Fenicia gold ship logo sign mounted on the real black exterior wall of the restaurant, close up architectural detail, dramatic side lighting highlighting the gold metallic logo, sharp realistic photography" },

  # ── Ice cream with real storefront ────────────────────────────────────────
  @{ name="r05-icecream-storefront"; ratio="4:5"; refs=@($ICECREAM,$STORE1);
     prompt="Black gloved hand holding a massive pistachio kashta ice cream cone with the Casa Fenicia storefront blurred in background, exact same ice cream and glove as in reference photo, same black storefront with gold lettering visible behind, professional food photography, depth of field, realistic" },

  @{ name="r06-icecream-portrait"; ratio="4:5"; refs=@($ICECREAM);
     prompt="Same pistachio kashta ice cream cone as in the reference photo, enormous cone covered in crushed green pistachios, dark moody black background, professional food photography, slightly different angle, sharper detail, commercial quality" },

  @{ name="r07-icecream-hero"; ratio="16:9"; refs=@($ICECREAM,$LOGO);
     prompt="Cinematic hero shot of the pistachio kashta ice cream cone from the reference held in front of the Casa Fenicia restaurant, logo visible on sign in background, editorial food photography, golden hour light, high quality, realistic" },

  # ── Wraps / shawarma with storefront ─────────────────────────────────────
  @{ name="r08-wraps-storefront"; ratio="4:5"; refs=@($WRAPS,$STORE2);
     prompt="Two hands holding two Casa Fenicia branded shawarma wraps wrapped in white paper with 'Casa Fenicia' text, same storefront as reference visible and blurred in background, same composition as reference photo, professional food photography, realistic" },

  @{ name="r09-wrap-closeup"; ratio="4:5"; refs=@($WRAPS);
     prompt="Close-up of Casa Fenicia shawarma wrap in branded white paper wrapper with 'Casa Fenicia' text, the same wrap from the reference photo, golden crispy flatbread, fillings visible at top, dark moody background, macro food photography, commercial quality" },

  @{ name="r10-wraps-hands-square"; ratio="1:1"; refs=@($WRAPS);
     prompt="Two people's hands each holding a Casa Fenicia branded wrap in white paper, slight overhead angle, same wraps as in reference photo, clean white background, appetizing food photography, lifestyle image" },

  # ── Interior atmosphere ───────────────────────────────────────────────────
  @{ name="r11-interior-dining"; ratio="16:9"; refs=@($LOGO);
     prompt="Interior of Casa Fenicia Lebanese bistro, intimate dark dining room, black walls with gold accents matching the brand colors from the logo, warm candles, dark wooden tables with gold cutlery, atmospheric restaurant photography, realistic, evening ambiance" },

  @{ name="r12-interior-detail"; ratio="4:5"; refs=@($LOGO);
     prompt="Interior design detail of Casa Fenicia restaurant, black wall with the gold Phoenician ship logo framed on it, warm accent lighting, Mediterranean decor, moody atmosphere, realistic interior photography" },

  # ── Lebanese food - realistic quality ─────────────────────────────────────
  @{ name="r13-sfiha-real"; ratio="4:5"; refs=@($LOGO);
     prompt="Freshly made Lebanese sfiha (open meat pie) on dark stone plate, restaurant table setting with Casa Fenicia branding visible on the napkin, authentic Lebanese bistro setting, natural restaurant lighting, realistic food photography, appetizing" },

  @{ name="r14-hummus-real"; ratio="4:5"; refs=@($LOGO);
     prompt="Bowl of creamy Lebanese hummus with olive oil pool and paprika served in Casa Fenicia restaurant, gold rim ceramic bowl on dark table, warm restaurant lighting, realistic food photography, authentic presentation" },

  @{ name="r15-baklava-real"; ratio="4:5"; refs=@($LOGO);
     prompt="Lebanese baklava and knafeh desserts on a gold plate at Casa Fenicia restaurant, same dark and gold brand aesthetic as logo, authentic Middle Eastern pastries glistening with honey, warm restaurant light, realistic food photography" },

  @{ name="r16-meze-table"; ratio="16:9"; refs=@($LOGO,$WRAPS);
     prompt="Full Lebanese meze table at Casa Fenicia restaurant, dark wood table with multiple dishes - hummus, falafel, tabbouleh, pita bread, drinks - same black and gold brand aesthetic, restaurant overhead shot, realistic professional food photography" },

  # ── Brand / marketing composites ─────────────────────────────────────────
  @{ name="r17-logo-food-composite"; ratio="16:9"; refs=@($LOGO,$ICECREAM);
     prompt="Elegant marketing image: the Casa Fenicia gold ship logo on black background on the left, with the pistachio ice cream cone from the reference on the right, clean brand aesthetic, luxury Lebanese bistro promotional image, high quality" },

  @{ name="r18-storefront-collage"; ratio="16:9"; refs=@($STORE1,$WRAPS,$ICECREAM);
     prompt="Lifestyle marketing collage of Casa Fenicia Lebanese Bistro: the real storefront, hands holding the branded wraps, and the pistachio ice cream, dark editorial layout, consistent brand colors black and gold, professional commercial photography feel" },

  # ── Menu items with logo watermark ───────────────────────────────────────
  @{ name="r19-coffee-branded"; ratio="4:5"; refs=@($LOGO);
     prompt="Lebanese espresso in black cup with gold rim on dark marble table, Casa Fenicia restaurant setting, same gold and black color scheme as logo, warm steam, professional coffee photography, branded napkin with logo visible, realistic" },

  @{ name="r20-lemonade-branded"; ratio="4:5"; refs=@($LOGO);
     prompt="Limonada Fenicia - fresh Lebanese lemonade in tall glass with mint and lemon slices, dark restaurant table setting, Casa Fenicia gold and black ambiance matching the logo colors, condensation on glass, realistic beverage photography" },

  # ── Social media formats ──────────────────────────────────────────────────
  @{ name="r21-story-icecream"; ratio="9:16"; refs=@($ICECREAM,$STORE1);
     prompt="Vertical Instagram story format: person holding pistachio ice cream cone in front of Casa Fenicia storefront, same ice cream as reference and same storefront, bright natural daylight, lifestyle street food content, highly realistic" },

  @{ name="r22-story-wraps"; ratio="9:16"; refs=@($WRAPS,$STORE2);
     prompt="Vertical Instagram story: two hands holding Casa Fenicia branded shawarma wraps in white paper on Valencia cobblestone street, same composition as reference, natural light, lifestyle content, realistic" },

  @{ name="r23-story-storefront"; ratio="9:16"; refs=@($STORE1,$LOGO);
     prompt="Vertical Instagram story format of Casa Fenicia storefront, same real black facade and gold sign as reference, beautiful Valencia Spain street, inviting atmosphere, travel and food lifestyle content, realistic" },

  # ── Atmosphere & mood ─────────────────────────────────────────────────────
  @{ name="r24-street-food-scene"; ratio="4:3"; refs=@($STORE1,$ICECREAM);
     prompt="Street food scene outside Casa Fenicia in Valencia, person holding pistachio ice cream cone, same real restaurant storefront in background as reference, cobblestone street, sunny day, authentic lifestyle photography, realistic" },

  @{ name="r25-entrance-night"; ratio="4:5"; refs=@($STORE1,$LOGO);
     prompt="Casa Fenicia restaurant entrance at night, same real black facade with illuminated gold sign as reference, warm golden light from inside, inviting atmosphere, couple entering the restaurant, Valencia old town, realistic night photography" },

  # ── OG / Hero images ──────────────────────────────────────────────────────
  @{ name="r26-og-hero"; ratio="16:9"; refs=@($LOGO,$STORE2);
     prompt="Premium Open Graph hero image for Casa Fenicia website: the real restaurant storefront from reference photo on the left, gold ship logo prominently on dark right side, 'Casa Fenicia - Lebanese Bistro Cafe - Valencia' text treatment, high quality marketing banner, dark luxury aesthetic" },

  @{ name="r27-food-hero"; ratio="16:9"; refs=@($ICECREAM,$WRAPS,$LOGO);
     prompt="Wide hero banner showing Casa Fenicia signature foods: pistachio ice cream cone and branded shawarma wraps from the reference photos arranged on dark slate surface with the gold ship logo, luxury food photography, dark and gold aesthetic matching the brand" },

  # ── More food detail ──────────────────────────────────────────────────────
  @{ name="r28-knafeh-real"; ratio="4:5"; refs=@($LOGO);
     prompt="Authentic Lebanese Knafeh cheese dessert fresh from the oven, bright orange shredded pastry on top, white cheese layer, orange blossom syrup being drizzled, dark plate on dark restaurant table, Casa Fenicia brand colors, realistic restaurant food photography" },

  @{ name="r29-falafel-real"; ratio="4:5"; refs=@($LOGO);
     prompt="Plate of freshly fried Lebanese falafel at Casa Fenicia, dark plate on dark restaurant table, tahini sauce, garnish, consistent with the restaurant's black and gold aesthetic, warm restaurant lighting, realistic food photography" },

  @{ name="r30-full-table"; ratio="16:9"; refs=@($LOGO,$WRAPS,$ICECREAM);
     prompt="Overhead shot of a Casa Fenicia restaurant table with the branded shawarma wraps from reference, pistachio ice cream, beverages, dark wood table, gold cutlery, matching the black and gold brand identity from the logo, editorial restaurant photography, realistic" }
)

Write-Host "Submitting $($prompts.Count) realistic tasks with reference images..." -ForegroundColor Cyan

$tasks = @()
foreach ($p in $prompts) {
  $inputObj = @{
    prompt        = $p.prompt
    aspect_ratio  = $p.ratio
    resolution    = "2K"
    output_format = "jpg"
  }
  if ($p.refs.Count -gt 0) { $inputObj["image_input"] = $p.refs }

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
      Write-Host "  [$($p.name)] FAILED: $($r.msg)" -ForegroundColor Red
    }
  } catch {
    Write-Host "  [$($p.name)] ERROR: $_" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 400
}

Write-Host "`nPolling $($tasks.Count) tasks..." -ForegroundColor Cyan
$done = @{}
$maxWait = 900
$elapsed = 0

while ($done.Count -lt $tasks.Count -and $elapsed -lt $maxWait) {
  Start-Sleep -Seconds 10
  $elapsed += 10
  foreach ($t in $tasks) {
    if ($done.ContainsKey($t.taskId)) { continue }
    try {
      $r = Invoke-RestMethod -Uri "$BASE_URL/api/v1/jobs/recordInfo?taskId=$($t.taskId)" -Method GET -Headers $headers
      $state = $r.data.state
      if ($state -eq "success") {
        $result = $r.data.resultJson | ConvertFrom-Json
        $url = $result.resultUrls[0]
        $outPath = Join-Path $OUT_DIR "$($t.name).jpg"
        Invoke-WebRequest -Uri $url -OutFile $outPath
        $done[$t.taskId] = $true
        Write-Host "  [$($t.name)] SAVED" -ForegroundColor Green
      } elseif ($state -eq "fail") {
        $done[$t.taskId] = $true
        Write-Host "  [$($t.name)] FAILED: $($r.data.failMsg)" -ForegroundColor Red
      }
    } catch {}
  }
  $remaining = $tasks.Count - $done.Count
  if ($remaining -gt 0) { Write-Host "  [$($elapsed)s] $remaining remaining..." -ForegroundColor DarkGray }
}

Write-Host "`nDone! $($done.Count)/$($tasks.Count) saved to public/ai-images-realistic/" -ForegroundColor Cyan
