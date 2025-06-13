const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SVGS_DIR = path.join(__dirname, '..', 'svgs');
const OUTPUT_DIR = path.join(__dirname, '..', 'token_pngs');
const LAYER_DEBUG_DIR = path.join(__dirname, '..', 'token_png_layers');

// Layer order from your contract (in reverse order since SVG applies them from last to first)
const LAYER_ORDER = [
    "Background",
    "Back Accessories",
    "Body",
    "Clothing",
    "Eyes",
    "Eye Accessories",
    "Mouth",
    "Hair and Hats",
    "Accessories"
];

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(LAYER_DEBUG_DIR)) {
    fs.mkdirSync(LAYER_DEBUG_DIR, { recursive: true });
}

// Extract base64 PNG buffers from SVG, in the order they appear (first = top, last = background)
function extractBase64PngBuffers(svgPath) {
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    // Extract the entire background-image style
    const styleMatch = svgContent.match(/style="[^"]*background-image:url\(([^)]+)\)[^"]*"/);
    if (!styleMatch) {
        throw new Error('No background-image style found in SVG');
    }
    // Split the URLs and extract base64 data
    const urls = styleMatch[1].split('),url(');
    // Synchronous extraction of base64 PNG buffers
    const pngBuffers = urls.map(url => {
        const match = url.match(/data:image\/png;base64,([^)]+)/);
        if (!match) {
            console.warn('Warning: Could not extract base64 data from URL:', url);
            return null;
        }
        return Buffer.from(match[1], 'base64');
    }).filter(Boolean);
    if (pngBuffers.length === 0) {
        throw new Error('No valid base64 data found in SVG');
    }
    return pngBuffers;
}

// Compose the PNG by layering from background (last) to top (first)
async function composeTokenImage(svgPath, outputPath) {
    try {
        const svgFile = path.basename(svgPath);
        // Synchronously extract PNG buffers in order (first = top, last = background)
        const layerBuffers = extractBase64PngBuffers(svgPath);
        console.log(`\n${svgFile}: Found ${layerBuffers.length} layers.`);
        // Save each layer as a separate PNG for inspection
        for (let i = 0; i < layerBuffers.length; i++) {
            const layerPath = path.join(LAYER_DEBUG_DIR, `${svgFile.replace('.svg', '')}_layer${i}.png`);
            await sharp(layerBuffers[i])
                .png({ quality: 100, compressionLevel: 0 })
                .toFile(layerPath);
            // Log dimensions
            const metadata = await sharp(layerBuffers[i]).metadata();
            console.log(`  Layer ${i}: ${metadata.width}x${metadata.height}`);
        }
        // Start with the background (last buffer)
        let composite = sharp(layerBuffers[layerBuffers.length - 1])
            .resize(1200, 1200, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png({ quality: 100, compressionLevel: 0 });
        // Composite each layer from second-to-last up to the first (topmost)
        for (let i = layerBuffers.length - 2; i >= 0; i--) {
            const layerPng = await sharp(layerBuffers[i])
                .resize(1200, 1200, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png({ quality: 100, compressionLevel: 0 })
                .toBuffer();
            composite = composite.composite([
                {
                    input: layerPng,
                    blend: 'over'
                }
            ]);
        }
        await composite
            .png({ quality: 100, compressionLevel: 0, force: true })
            .toFile(outputPath);
        console.log(`✅ Converted: ${svgFile}`);
    } catch (error) {
        console.error(`❌ Error converting ${svgPath}:`, error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

async function main() {
    console.log('Starting token SVG to PNG conversion...\n');
    try {
        const files = fs.readdirSync(SVGS_DIR)
            .filter(file => file.toLowerCase().endsWith('.svg'));
        if (files.length === 0) {
            console.log('No SVG files found in the svgs directory!');
            return;
        }
        console.log(`Found ${files.length} SVG files to convert\n`);
        for (const file of files) {
            const svgPath = path.join(SVGS_DIR, file);
            const outputPath = path.join(OUTPUT_DIR, file.replace('.svg', '.png'));
            await composeTokenImage(svgPath, outputPath);
        }
        console.log('\n✨ Conversion complete!');
        console.log(`PNGs saved in: ${OUTPUT_DIR}`);
        console.log(`Layer PNGs saved in: ${LAYER_DEBUG_DIR}`);
    } catch (error) {
        console.error('\n❌ Error during conversion:', error);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

main().catch(console.error); 