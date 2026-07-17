#!/usr/bin/env node
/**
 * Process food photos with GPT Image 2
 * - Remove background (keep food+plate+placemat)
 * - Replace table with pitch black
 * - Add Casa Fenicia logo to bottom right
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = 'C:\\Users\\Martin\\.cursor\\projects\\c-Users-Martin-Desktop-casafenicia\\assets';
const OUT_DIR = path.join(PROJECT_ROOT, 'public', 'ai-images', 'processed-food');
const LOGO_PATH = path.join(PROJECT_ROOT, 'public', 'ref', 'logo.png');

// Get API key
function getApiKey() {
    const envLocal = path.join(PROJECT_ROOT, '.env.local');
    const envFile = path.join(PROJECT_ROOT, '.env');

    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

    for (const file of [envLocal, envFile]) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const match = content.match(/OPENAI_API_KEY\s*=\s*"?([^"\r\n]+)"?/);
            if (match) return match[1].trim();
        }
    }

    throw new Error('OPENAI_API_KEY not found in env vars or .env files');
}

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Verify logo exists
if (!fs.existsSync(LOGO_PATH)) {
    console.error(`Logo not found at ${LOGO_PATH}`);
    process.exit(1);
}

// Get source images
const sourceImages = fs.readdirSync(ASSETS_DIR)
    .filter(f => /photo_\d+_2026-05-11.*\.png$/i.test(f))
    .sort();

if (sourceImages.length === 0) {
    console.error(`No source images found in ${ASSETS_DIR}`);
    process.exit(1);
}

console.log(`Found ${sourceImages.length} food photos to process`);
console.log(`Output: ${OUT_DIR}`);
console.log(`Logo: ${LOGO_PATH}`);

const API_KEY = getApiKey();

const EDIT_PROMPT = `Edit this food photo professionally:

1. BACKGROUND: Remove the dark table/wooden surface and replace with PURE PITCH BLACK (#000000) background. The black should be completely uniform and dramatic.

2. KEEP: Preserve the food, plates, bowls, glasses, and the woven circular placemat EXACTLY as they appear - same position, lighting, colors, texture, and composition.

3. LOGO: Add the Casa Fenicia logo (gold ship on black circular background) to the bottom right corner. The logo should be small and elegant (about 8% of image width), positioned with margin from edges, and have a subtle shadow for depth. DO NOT obstruct the food.

4. RESULT: Professional restaurant marketing photo with dramatic black background, showcasing the food beautifully with tasteful branding.

CRITICAL: Do not change the food appearance, colors, or arrangement in any way. Only change the background to black and add the logo.`;

async function processImage(filename, index, total) {
    const inputPath = path.join(ASSETS_DIR, filename);
    const baseName = path.basename(filename, '.png');
    const outputPath = path.join(OUT_DIR, `${baseName}-processed.png`);

    console.log(`\n[${index + 1}/${total}] Processing: ${filename}`);

    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', EDIT_PROMPT);
    form.append('image', fs.createReadStream(inputPath), { filename: 'input.png', contentType: 'image/png' });
    form.append('logo', fs.createReadStream(LOGO_PATH), { filename: 'logo.png', contentType: 'image/png' });

    const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            ...form.getHeaders()
        },
        timeout: 120000
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);

                    if (response.error) {
                        console.error(`  ERROR: ${response.error.message}`);
                        resolve(false);
                        return;
                    }

                    if (response.data && response.data[0]) {
                        const result = response.data[0];

                        if (result.b64_json) {
                            fs.writeFileSync(outputPath, Buffer.from(result.b64_json, 'base64'));
                            console.log(`  SUCCESS: Saved to ${outputPath}`);
                            resolve(true);
                        } else if (result.url) {
                            // Download from URL
                            https.get(result.url, (imgRes) => {
                                const chunks = [];
                                imgRes.on('data', c => chunks.push(c));
                                imgRes.on('end', () => {
                                    fs.writeFileSync(outputPath, Buffer.concat(chunks));
                                    console.log(`  SUCCESS: Saved to ${outputPath}`);
                                    resolve(true);
                                });
                            }).on('error', (e) => {
                                console.error(`  Download error: ${e.message}`);
                                resolve(false);
                            });
                        } else {
                            console.error(`  Unexpected response format`);
                            console.log(data);
                            resolve(false);
                        }
                    } else {
                        console.error(`  No data in response`);
                        console.log(data);
                        resolve(false);
                    }
                } catch (e) {
                    console.error(`  Parse error: ${e.message}`);
                    console.log(data);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`  Request error: ${e.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.error(`  Request timeout`);
            req.destroy();
            resolve(false);
        });

        form.pipe(req);
    });
}

async function main() {
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < sourceImages.length; i++) {
        const success = await processImage(sourceImages[i], i, sourceImages.length);
        if (success) processed++;
        else failed++;

        // Rate limiting
        if (i < sourceImages.length - 1) {
            console.log('  Waiting 3s for rate limit...');
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    console.log('\n========================================');
    console.log('DONE!');
    console.log(`Processed: ${processed}/${sourceImages.length}`);
    if (failed > 0) console.log(`Failed: ${failed}`);
    console.log(`Output: ${OUT_DIR}`);
}

main().catch(console.error);
