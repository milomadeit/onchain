const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const config = require("../collection_config.json");

// CHANGE THIS to your target contract
const CONTRACT_ADDRESS = "0x4a3f1e8d64f490CC075182afeD246B0Ea81aE0F7"; // new abstract ca
// const CONTRACT_ADDRESS = "0xCdb43943699f41F1c61D4e67bf4B0163C4F90CAb"; // Hyperevm

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTst", CONTRACT_ADDRESS, deployer);

  // Confirm contract state
  const isOwner = await contract.owner();
  const sealed = await contract.isContractSealed();
  console.log("Owner:", isOwner);
  console.log("Your address:", deployer.address);
  console.log("Is contract sealed?", sealed);

  if (deployer.address.toLowerCase() !== isOwner.toLowerCase()) {
    console.error("You are not the contract owner. Exiting.");
    process.exit(1);
  }
  if (sealed) {
    console.error("Contract is sealed. Cannot upload traits.");
    process.exit(1);
  }

  // Loop and upload each layer
  for (let layer = 0; layer < config.LAYER_NAMES.length; layer++) {
    const layerName = config.LAYER_NAMES[layer];
    const layerDir = path.join(__dirname, "..", "traits", layerName);

    if (!fs.existsSync(layerDir)) {
      console.error(`❌ Layer folder missing: ${layerDir}`);
      continue;
    }

    let traitFiles = fs.readdirSync(layerDir)
      .filter(f => f.toLowerCase().endsWith(".svg") || f.toLowerCase().endsWith(".png"));

    if (traitFiles.length !== config.TIERS[layer].length) {
      console.error(
        `❌ Layer "${layerName}": trait count (${traitFiles.length}) does not match TIERS[${layer}].length (${config.TIERS[layer].length})`
      );
      continue;
    }

    traitFiles = traitFiles.sort(); // Consistent ordering

    console.log(`\nPreparing to upload layer "${layerName}"...`);
    console.log(`Found ${traitFiles.length} trait files`);

    const traitDTOs = traitFiles.map((file, i) => {
      const filePath = path.join(layerDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const base = path.basename(file, path.extname(file));
      const displayName = base.includes('#') ? base.split('#')[0] : base;
      const ext = path.extname(filePath).toLowerCase();
      let mimetype = "";
      if (ext === ".svg") mimetype = "image/svg+xml";
      else if (ext === ".png") mimetype = "image/png";
      else throw new Error(`Unsupported file type: ${filePath}`);

      console.log(`Preparing trait ${i}: ${displayName} (${mimetype}, ${fileBuffer.length} bytes)`);
      
      return {
        name: displayName,
        mimetype,
        data: fileBuffer,
        hide: false,
        useExistingData: false,
        existingDataIndex: 0
      };
    });

    try {
      console.log(`\nUploading layer "${layerName}"...`);
      const tx = await contract.addLayer(layer, traitDTOs);
      console.log(`Tx hash for addLayer: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Uploaded layer "${layerName}"`);

      // Verify the upload
      try {
        const traitDetails = await contract.traitDetails(layer, 0);
        console.log(`\nVerification - First trait details:`);
        console.log(`- Name: ${traitDetails.name}`);
        console.log(`- MimeType: ${traitDetails.mimetype}`);
        console.log(`- Hide: ${traitDetails.hide}`);
      } catch (error) {
        console.log(`\n❌ Verification failed:`);
        console.log(error.message);
      }

    } catch (err) {
      if (err && err.error && err.error.data && err.error.data.message) {
        console.error(`❌ Error uploading layer "${layerName}": ${err.error.data.message}`);
      } else {
        console.error(`❌ Error uploading layer "${layerName}":`, err);
      }
    }
  }
}

main().catch(e => {
  console.error("❌ Fatal error during trait upload:", e);
  process.exit(1);
});
