const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Set contract address after deploy!
const CONTRACT_ADDRESS = "0xYourContractAddressHere";
const NUM_LAYERS = 2; // set to your actual layer count

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("Indelible", CONTRACT_ADDRESS, deployer);

  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    const layerDir = path.join(__dirname, `../traits/layer${layer}`);
    const traitFiles = fs.readdirSync(layerDir);

    for (let i = 0; i < traitFiles.length; i++) {
      const svg = fs.readFileSync(path.join(layerDir, traitFiles[i]), "utf8");
      // Adjust function name/signature as needed!
      const tx = await contract.addTrait(layer, svg);
      await tx.wait();
      console.log(`Uploaded trait ${i} for layer ${layer}`);
    }
  }
}

main().catch(console.error);
