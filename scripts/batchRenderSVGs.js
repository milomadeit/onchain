const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

async function renderSVGToPNG(svgPath, outputPath) {
    try {
        // Read the SVG file
        const svgBuffer = await fs.readFile(svgPath);
        
        // First convert SVG to PNG at original size
        const originalSizeBuffer = await sharp(svgBuffer)
            .png({
                quality: 100,
                compressionLevel: 0,
                palette: false
            })
            .toBuffer();
        
        // Then scale up to 1200x1200 using nearest neighbor
        await sharp(originalSizeBuffer)
            .resize(1200, 1200, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
                kernel: 'nearest' // Use nearest neighbor for pixel art
            })
            .png({
                quality: 100,
                compressionLevel: 0,
                palette: false
            })
            .toFile(outputPath);
            
        console.log(`Successfully rendered ${path.basename(svgPath)} to ${path.basename(outputPath)}`);
    } catch (error) {
        console.error(`Error rendering ${path.basename(svgPath)}:`, error);
        throw error;
    }
}

async function main() {
    try {
        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, "../token_pngs");
        await fs.mkdir(outputDir, { recursive: true });
        
        // Get all SVG files from the svgs directory
        const svgDir = path.join(__dirname, "../svgs");
        const files = await fs.readdir(svgDir);
        const svgFiles = files.filter(file => file.endsWith('.svg'));
        
        // Process each SVG file
        for (const svgFile of svgFiles) {
            const svgPath = path.join(svgDir, svgFile);
            const outputPath = path.join(outputDir, svgFile.replace('.svg', '.png'));
            await renderSVGToPNG(svgPath, outputPath);
        }
        
        console.log('All SVGs have been converted to PNGs!');
    } catch (error) {
        console.error("Error in main:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 