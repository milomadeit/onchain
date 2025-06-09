const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// SAFETY: Load config for layer/trait info
const config = require("../collection_config.json");
const CONTRACT_ADDRESS = "0xYourContractAddressHere"; // TODO: Set to your contract address!

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("Indelible", CONTRACT_ADDRESS, deployer);

  for (let layer = 0; layer < config.LAYER_NAMES.length; layer++) {
    const layerName = config.LAYER_NAMES[layer];
    const layerDir = path.join(__dirname, "..", "traits", layerName);

    if (!fs.existsSync(layerDir)) {
      throw new Error(`Layer folder missing: ${layerDir}`);
    }

    const traitFiles = fs.readdirSync(layerDir).filter(f => f.endsWith(".svg") || f.endsWith(".png"));
    if (traitFiles.length !== config.TIERS[layer].length) {
      throw new Error(
        `Layer "${layerName}" trait count (${traitFiles.length}) does not match TIERS[${layer}].length (${config.TIERS[layer].length})`
      );
    }

    for (let i = 0; i < traitFiles.length; i++) {
      const filePath = path.join(layerDir, traitFiles[i]);
      const svgOrPng = fs.readFileSync(filePath, "utf8"); // or use "base64" for PNG
      // TODO: Set correct contract function and parameters as needed:
      // For advanced usage, build and pass the full TraitDTO struct as per your contract.
      const tx = await contract.addTrait(layer, i, {
        name: traitFiles[i],
        mimetype: filePath.endsWith(".svg") ? "image/svg+xml" : "image/png",
        data: svgOrPng,
        hide: false,
        useExistingData: false,
        existingDataIndex: 0
      });
      await tx.wait();
      console.log(`✅ Uploaded trait ${traitFiles[i]} (${i}) for layer ${layerName} (${layer})`);
    }
  }
}

main().catch(e => {
  console.error("ERROR during trait upload:", e);
  process.exit(1);
});
