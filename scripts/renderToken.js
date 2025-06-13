const { ethers } = require("hardhat");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

async function renderTokenToPNG(tokenId, svgData, outputPath) {
    try {
        // Remove the data:image/svg+xml;base64, prefix if present
        const base64Data = svgData.replace(/^data:image\/svg\+xml;base64,/, '');
        
        // Convert base64 to buffer
        const svgBuffer = Buffer.from(base64Data, 'base64');
        
        // First convert SVG to PNG at original size (32x32)
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
            
        console.log(`Successfully rendered token ${tokenId} to ${outputPath}`);
    } catch (error) {
        console.error(`Error rendering token ${tokenId}:`, error);
        throw error;
    }
}

async function main() {
    // Get the contract instance
    const contract = await ethers.getContract("AbsChadsTst");
    
    // Example: Render token ID 1
    const tokenId = 1;
    
    try {
        // Get the SVG data from the contract
        const svgData = await contract.tokenIdToSVG(tokenId);
        
        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, "../token_pngs");
        await fs.mkdir(outputDir, { recursive: true });
        
        // Render the token
        const outputPath = path.join(outputDir, `token${tokenId}.png`);
        await renderTokenToPNG(tokenId, svgData, outputPath);
        
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