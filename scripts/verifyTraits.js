const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const config = require("../collection_config.json");

const CONTRACT_ADDRESS = "0xB65FBf1087c02E0600746C755CEaC07a4cD972ec";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTest2", CONTRACT_ADDRESS, deployer);

  console.log("\nVerifying trait data...\n");

  for (let layer = 0; layer < config.LAYER_NAMES.length; layer++) {
    const layerName = config.LAYER_NAMES[layer];
    const layerDir = path.join(__dirname, "..", "traits", layerName);

    // Get files from directory
    const files = fs.readdirSync(layerDir)
      .filter(f => f.toLowerCase().endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    console.log(`Layer ${layer} (${layerName}):`);
    console.log(`- Files in directory: ${files.length}`);
    console.log(`- Expected in config: ${config.TIERS[layer].length}`);
    
    if (files.length !== config.TIERS[layer].length) {
      console.log("❌ MISMATCH: File count doesn't match config!");
      console.log("Files:", files);
    }

    // Verify file weights match config
    const weights = files.map(f => parseInt(f.split("#")[1]));
    const configWeights = config.TIERS[layer];
    
    if (weights.length !== configWeights.length) {
      console.log("❌ MISMATCH: Weight count doesn't match!");
    } else {
      const mismatches = weights.filter((w, i) => w !== configWeights[i]);
      if (mismatches.length > 0) {
        console.log("❌ MISMATCH: Weights don't match config!");
        console.log("File weights:", weights);
        console.log("Config weights:", configWeights);
      }
    }
    console.log("");
  }

  // Check contract state
  try {
    const isSealed = await contract.isContractSealed();
    console.log("Contract sealed:", isSealed);
  } catch (error) {
    console.log("Error checking contract state:", error.message);
  }
}

main().catch(console.error); 