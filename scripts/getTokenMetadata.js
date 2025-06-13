const hre = require("hardhat");

const CONTRACT_ADDRESS = "0xB65FBf1087c02E0600746C755CEaC07a4cD972ec";
const TOKEN_ID = 1;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTest2", CONTRACT_ADDRESS, deployer);
  try {
    const uri = await contract.tokenURI(TOKEN_ID);
    if (uri.startsWith("data:application/json;base64,")) {
      const b64 = uri.replace("data:application/json;base64,", "");
      const json = Buffer.from(b64, "base64").toString("utf-8");
      const parsed = JSON.parse(json);
      console.log("\nDecoded metadata for token 1:\n");
      console.log(JSON.stringify(parsed, null, 2));
    } else {
      console.warn("Token does not have a base64-encoded tokenURI.");
    }
  } catch (error) {
    console.error("Error fetching tokenURI:", error.message);
  }
}

main().catch(console.error); 