const { ethers } = require("hardhat");
const fs = require("fs").promises;
const path = require("path");

const num_tokens = 100;

async function saveTokenSVG(tokenId, svgData, outputPath) {
    try {
        // Remove the data:image/svg+xml;base64, prefix if present
        const base64Data = svgData.replace(/^data:image\/svg\+xml;base64,/, '');
        
        // Convert base64 to buffer and save as SVG
        const svgBuffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(outputPath, svgBuffer);
            
        console.log(`Successfully saved token ${tokenId} to ${outputPath}`);
    } catch (error) {
        console.error(`Error saving token ${tokenId}:`, error);
        throw error;
    }
}

async function main() {
    // Get the contract instance
    const contractAddress = "0x4a3f1e8d64f490CC075182afeD246B0Ea81aE0F7"; // Replace with your deployed contract address
    const AbsChadsTst = await ethers.getContractFactory("AbsChadsTst");
    const contract = await AbsChadsTst.attach(contractAddress);
    
    // Create svgs directory if it doesn't exist
    const outputDir = path.join(__dirname, "../svgs");
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save SVGs for tokens 0 to num_tokens-1
    for (let tokenId = 0; tokenId < num_tokens; tokenId++) {
        try {
            // Get the SVG data from the contract
            const svgData = await contract.tokenIdToSVG(tokenId);
            
            // Save the SVG
            const outputPath = path.join(outputDir, `token${tokenId}.svg`);
            await saveTokenSVG(tokenId, svgData, outputPath);
            
        } catch (error) {
            console.error(`Error processing token ${tokenId}:`, error);
        }
    }
    
    console.log('All token SVGs have been saved!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 