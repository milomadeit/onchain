const hre = require("hardhat");

// Get the contract address from your deployment
const CONTRACT_ADDRESS = "0x4a3f1e8d64f490CC075182afeD246B0Ea81aE0F7"; // Update this with your deployed contract address
const TOKEN_IDS = [0]

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTst", CONTRACT_ADDRESS, deployer);
 
  for (const TOKEN_ID of TOKEN_IDS) {
    try {
      const owner = await contract.ownerOf(TOKEN_ID);
      console.log(`Token ${TOKEN_ID} exists and is owned by: ${owner}`);
      
      const uri = await contract.tokenURI(TOKEN_ID);
      console.log("\nRaw tokenURI:");
      console.log(uri);

      if (uri.startsWith("data:application/json;base64,")) {
        const b64 = uri.replace("data:application/json;base64,", "");
        const json = Buffer.from(b64, "base64").toString("utf-8");
        console.log("\nDecoded metadata JSON:");
        console.log(JSON.stringify(JSON.parse(json), null, 2));

        const parsed = JSON.parse(json);
        if (parsed.image_data) {
          if (parsed.image_data.startsWith("data:image/svg+xml;base64,")) {
            const svgB64 = parsed.image_data.replace("data:image/svg+xml;base64,", "");
            const svg = Buffer.from(svgB64, "base64").toString("utf-8");
            console.log("\nSVG Art Output (first 500 chars):");
            console.log(svg.slice(0, 500) + "...");
            require("fs").writeFileSync(`token${TOKEN_ID}.svg`, svg);
            console.log(`\nFull SVG saved as token${TOKEN_ID}.svg`);
          } else {
            console.log("\nNon-SVG image_data, paste this in a browser to view:");
            console.log(parsed.image_data);
          }
        } else if (parsed.image) {
          console.log("\nImage URL:", parsed.image);
        }
      }
    } catch (error) {
      console.log(`Error with token ${TOKEN_ID}:`, error.message);
    }
  }
}

main().catch(console.error);
