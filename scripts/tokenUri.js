const hre = require("hardhat");

// Set contract address!
const CONTRACT_ADDRESS = "0xYourContractAddressHere";
const TOKEN_ID = 1; // Set to your minted token

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("Indelible", CONTRACT_ADDRESS, deployer);

  const uri = await contract.tokenURI(TOKEN_ID);
  console.log(uri); // should be base64-encoded JSON
}

main().catch(console.error);
