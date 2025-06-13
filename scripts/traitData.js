const hre = require("hardhat");
const config = require("../collection_config.json");

const CONTRACT_ADDRESS = "0x9b3540614Aa8aBbC97eE5f7F921d0a97B825f7D0"; // double-check last char!

// const CONTRACT_ADDRESS = "0xCdb43943699f41F1c61D4e67bf4B0163C4F90CAb"; // hyperevm
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("onchain", CONTRACT_ADDRESS, deployer);

  for (let layer = 0; layer < config.LAYER_NAMES.length; layer++) {
    const layerName = config.LAYER_NAMES[layer];
    const numTraits = config.TIERS[layer].length;

    console.log(`\n--- Layer: ${layerName} (index ${layer}) ---`);
    for (let traitIndex = 0; traitIndex < numTraits; traitIndex++) {
      try {
        const trait = await contract.traitDetails(layer, traitIndex);
        // Try reading data
        let data = "";
        let dataLength = 0;
        let hasData = false;
        try {
          data = await contract.traitData(layer, traitIndex);
          hasData = !!data && data.length > 0;
          dataLength = Buffer.from(data, 'utf8').length;
        } catch {
          hasData = false;
        }

        const status = hasData ? `✅ Data present (${dataLength} bytes)` : "❌ No data";

        console.log(`Trait #${traitIndex}: Name="${trait.name}", Mime="${trait.mimetype}", Hide=${trait.hide} | ${status}`);
      } catch (err) {
        console.log(`❌ Missing trait at layer ${layer}, trait ${traitIndex}`);
      }
    }
  }
}

main().catch(console.error);
