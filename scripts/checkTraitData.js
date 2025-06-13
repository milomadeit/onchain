const hre = require("hardhat");

const CONTRACT_ADDRESS = "0xB65FBf1087c02E0600746C755CEaC07a4cD972ec";
const TOKEN_ID = 11; // The failing token

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTest2", CONTRACT_ADDRESS, deployer);

  try {
    // Get the token's hash
    const hash = await contract.tokenIdToHash(TOKEN_ID);
    console.log(`\nToken ${TOKEN_ID} hash: ${hash}`);

    // Parse the hash into trait indices
    const traitIndices = [];
    for (let i = 0; i < 9; i++) {
      const traitIndex = parseInt(hash.slice(i * 3, (i + 1) * 3));
      traitIndices.push(traitIndex);
    }

    console.log("\nTrait indices for each layer:");
    const layerNames = [
      "Accessories",
      "Hair and Hats",
      "Mouth",
      "Eye Accessories",
      "Eyes",
      "Clothing",
      "Body",
      "Back Accessories",
      "Background"
    ];

    // Try to get trait data for each layer
    for (let i = 0; i < traitIndices.length; i++) {
      try {
        const traitData = await contract.traitData(i, traitIndices[i]);
        const traitDetails = await contract.traitDetails(i, traitIndices[i]);
        console.log(`\nLayer ${i} (${layerNames[i]}) - Trait ${traitIndices[i]}:`);
        console.log(`- Name: ${traitDetails.name}`);
        console.log(`- MimeType: ${traitDetails.mimetype}`);
        console.log(`- Data length: ${traitData.length} bytes`);
      } catch (error) {
        console.log(`\n❌ Error getting trait data for layer ${i} (${layerNames[i]}) - Trait ${traitIndices[i]}:`);
        console.log(error.message);
      }
    }

  } catch (error) {
    console.log("Error:", error.message);
  }
}

main().catch(console.error); 