$API_KEY = "16dfa559457c9463573192feea84ecdf"
$BASE_URL = "https://api.kie.ai"
$OUT_DIR  = "$PSScriptRoot\..\public\ai-images"
$headers  = @{ "Authorization" = "Bearer $API_KEY"; "Content-Type" = "application/json" }

$prompts = @(
  # ── Hero / banner (16:9) ──────────────────────────────────────────────────
  @{ name="01-hero-restaurant-interior"; ratio="16:9";
     prompt="Moody luxury Lebanese bistro interior at night, black walls with gold ornamental accents, warm amber candlelight on dark wooden tables, intimate Mediterranean atmosphere, cinematic wide shot, professional architectural photography, 8K" },
  @{ name="02-hero-street-exterior"; ratio="16:9";
     prompt="Exterior of an elegant Lebanese bistro cafe in Valencia Spain old town, black storefront with gold lettering 'Casa Fenicia', golden hour evening light, cobblestone street, people walking, cinematic street photography, high detail" },
  @{ name="03-hero-meze-spread"; ratio="16:9";
     prompt="Stunning overhead flat lay of a full Lebanese meze spread on dark slate table: hummus, falafel, tabbouleh, baba ghanoush, pita bread, kibbeh, baklava, gold cutlery, restaurant table setting, luxury food photography, 8K" },
  @{ name="04-hero-food-portrait"; ratio="16:9";
     prompt="Dark moody Lebanese feast table, multiple dishes served on black plates with gold rims, candlelight, Mediterranean restaurant, cinematic warm tones, professional food photography wide angle" },

  # ── Sfiha & wraps ─────────────────────────────────────────────────────────
  @{ name="05-sfiha-closeup"; ratio="4:5";
     prompt="Sfiha Lebanese open meat pie close-up, beautifully seasoned ground lamb with pine nuts and spices on golden flatbread, dark moody slate background, steam rising, garnished with fresh parsley and lemon wedge, macro food photography, high detail" },
  @{ name="06-sfiha-hand-wrap"; ratio="4:5";
     prompt="Hand in black glove holding a Lebanese sfiha wrap in white branded paper, close up, street food style, dark background, cinematic lighting, professional commercial photography, dramatic shadows" },
  @{ name="07-fatayer-spinach"; ratio="4:5";
     prompt="Lebanese Fatayer de Espinaca - triangular spinach pastries golden brown and flaky, arranged on dark wood board with lemon wedges and fresh herbs, dark moody background, professional food photography, macro detail" },

  # ── Kibbeh & falafel ──────────────────────────────────────────────────────
  @{ name="08-kibbeh"; ratio="4:5";
     prompt="Lebanese Kibbeh fried meat croquettes with bulgur and pine nuts, dark ceramic plate, tahini dipping sauce, garnished with parsley, dark moody elegant background, professional restaurant food photography, crispy golden texture" },
  @{ name="09-falafel-plate"; ratio="4:5";
     prompt="Fresh fried falafel platter on dark plate, crispy golden-green exterior cut to reveal fluffy green interior, tahini sauce drizzle, fresh herbs, tomato, pita bread, dark elegant background, macro food photography" },
  @{ name="10-falafel-closeup"; ratio="1:1";
     prompt="Extreme close-up macro of freshly fried falafel halves showing the vibrant green herby interior texture, golden crispy exterior, sesame seeds, dark dramatic background, professional food photography" },

  # ── Hummus & spreads ──────────────────────────────────────────────────────
  @{ name="11-hummus"; ratio="4:5";
     prompt="Perfect bowl of Lebanese hummus with a generous pool of golden olive oil, paprika, whole chickpeas, za'atar herb swirl, dark slate background, pita bread pieces, luxury food photography, overhead angle, high detail" },
  @{ name="12-manakish"; ratio="4:5";
     prompt="Mini Lebanese Manakish flatbreads with za'atar and melted white cheese, freshly baked golden and crispy, dark wood surface, warm steam, traditional Middle Eastern bread, professional food photography, moody lighting" },

  # ── Sweets ────────────────────────────────────────────────────────────────
  @{ name="13-baklava-classic"; ratio="4:5";
     prompt="Baklava Clasico Lebanese honey pastry close-up, thin golden phyllo layers glistening with honey syrup, chopped pistachios and walnuts, dark elegant background, macro food photography, luxury dessert, dramatic lighting" },
  @{ name="14-baklava-pistachio"; ratio="4:5";
     prompt="Baklava Pistacho close-up, vibrant green crushed pistachios coating rich golden honey pastry layers, honey drizzle, dark moody background, gold plate, luxury Lebanese dessert photography, 8K detail" },
  @{ name="15-baklava-tower"; ratio="1:1";
     prompt="Tower of assorted Lebanese baklava pieces stacked artistically, honey dripping down the sides, crushed pistachios, dark black background, dramatic side lighting, macro food photography, golden glow" },
  @{ name="16-knafeh"; ratio="4:5";
     prompt="Knafeh Lebanese cheese dessert, golden orange shredded pastry top with melted white cheese underneath, orange blossom syrup being poured, rosewater aroma, dark elegant background, restaurant quality food photography" },

  # ── Ice cream ─────────────────────────────────────────────────────────────
  @{ name="17-kashta-icecream-glove"; ratio="4:5";
     prompt="Black gloved hand holding enormous Lebanese Kashta pistachio ice cream cone, white creamy kashta covered completely in crushed green pistachios piled high, dark moody background, dramatic lighting, commercial food photography" },
  @{ name="18-kashta-icecream-white"; ratio="4:5";
     prompt="Tall Lebanese pistachio kashta ice cream cone, creamy white ice cream topped with generous coating of vibrant green crushed pistachios, bright clean background, professional food photography, appetizing, close-up" },
  @{ name="19-kashta-icecream-overhead"; ratio="1:1";
     prompt="Overhead view of Lebanese kashta pistachio ice cream cone lying on dark slate, surrounded by scattered crushed pistachios and rose petals, flat lay food photography, moody elegant, luxury dessert" },

  # ── Drinks ────────────────────────────────────────────────────────────────
  @{ name="20-lemonade-fenicia"; ratio="4:5";
     prompt="Limonada Fenicia - Lebanese style fresh lemonade in a tall gold-rimmed glass, vibrant yellow-green, fresh mint leaves, lemon slices, crushed ice, dark moody background, condensation on glass, luxury drink photography" },
  @{ name="21-coffee-espresso"; ratio="4:5";
     prompt="Perfect Lebanese espresso in small black ceramic cup with gold rim, rich golden crema, dark marble surface, steam rising, moody dark background, professional coffee photography, cinematic lighting" },
  @{ name="22-cafe-cremaet"; ratio="4:5";
     prompt="Cafe Cremaet - Spanish creamy coffee with golden rum foam, traditional ceramic cup, dark background, warm golden light, professional drink photography, caramelized sugar on top, aromatic steam" },
  @{ name="23-fruit-cocktail"; ratio="4:5";
     prompt="Colorful Mediterranean fruit cocktail in elegant dark glass with gold rim, fresh tropical fruits, garnished with mint and edible flowers, dark moody background, luxury beverage photography, ice glistening" },

  # ── Restaurant atmosphere ─────────────────────────────────────────────────
  @{ name="24-interior-tables"; ratio="16:9";
     prompt="Intimate Lebanese restaurant interior, dark walls, gold lanterns and hanging lights, dark wood tables set for dinner, gold and black decor, warm candlelight ambiance, high-end Mediterranean bistro, professional interior photography" },
  @{ name="25-chef-preparing"; ratio="16:9";
     prompt="Chef in black apron preparing Lebanese flatbread on stone oven, artisan bakery kitchen, flour dusted dark surface, warm golden oven light, motion blur of skilled hands, documentary style food photography" },
  @{ name="26-valencia-street-night"; ratio="16:9";
     prompt="Evening in Valencia Spain historic Ciutat Vella, cobblestone narrow street at golden hour, warm restaurant lights spilling onto street, Mediterranean architecture, people dining outside, cinematic travel photography" },

  # ── Mixed platters & social ───────────────────────────────────────────────
  @{ name="27-meze-overhead-square"; ratio="1:1";
     prompt="Perfect Lebanese meze overhead flat lay on black slate: small gold bowls of hummus, baba ghanoush, tabbouleh, falafel, kibbeh, pita triangles, olive oil drizzle, herbs, elegant restaurant plating, top view food photography" },
  @{ name="28-sweets-platter"; ratio="1:1";
     prompt="Assorted Lebanese sweets platter on gold plate: baklava, knafeh, pistachio macarons, ma'amoul cookies, rosewater Turkish delight, edible flowers, dark elegant background, luxury dessert photography" },
  @{ name="29-tabbouleh"; ratio="4:5";
     prompt="Lebanese tabbouleh salad close-up, vibrant fresh parsley, ripe tomatoes, bulgur wheat, fresh mint, lemon wedge, olive oil drizzle, gold rimmed dark bowl, professional food photography, bright fresh colors against dark background" },
  @{ name="30-outdoor-dining"; ratio="16:9";
     prompt="Outdoor dining scene at a Lebanese bistro in Valencia Spain, dark bistro tables on cobblestone street, fairy string lights overhead, warm evening atmosphere, couples dining, Mediterranean summer evening, lifestyle photography" }
)

Write-Host "Submitting $($prompts.Count) tasks..." -ForegroundColor Cyan

$tasks = @()
foreach ($p in $prompts) {
  $body = @{
    model = "google/nano-banana"
    input = @{
      prompt      = $p.prompt
      image_size  = $p.ratio
      output_format = "jpeg"
    }
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
  Start-Sleep -Milliseconds 300
}

Write-Host "`nWaiting for $($tasks.Count) tasks to complete..." -ForegroundColor Cyan
$done = @{}

$maxWait = 600  # seconds
$elapsed = 0
while ($done.Count -lt $tasks.Count -and $elapsed -lt $maxWait) {
  Start-Sleep -Seconds 8
  $elapsed += 8
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
        Write-Host "  [$($t.name)] DONE -> saved" -ForegroundColor Green
      } elseif ($state -eq "fail") {
        $done[$t.taskId] = $true
        Write-Host "  [$($t.name)] FAILED: $($r.data.failMsg)" -ForegroundColor Red
      }
    } catch {
      # transient error, keep polling
    }
  }
  $remaining = $tasks.Count - $done.Count
  if ($remaining -gt 0) {
    Write-Host "  [$([int]$elapsed)s] $remaining still generating..." -ForegroundColor DarkGray
  }
}

Write-Host "`nAll done! $($done.Count)/$($tasks.Count) images saved to public/ai-images/" -ForegroundColor Cyan
