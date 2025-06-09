const hre = require("hardhat");

// Set contract address!
const CONTRACT_ADDRESS = "0xYourContractAddressHere";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("Indelible", CONTRACT_ADDRESS, deployer);

  const tx = await contract.mint({ value: hre.ethers.parseEther("0.01") }); // adjust price as needed
  const receipt = await tx.wait();
  console.log("Minted! Tx hash:", receipt.hash);
}

main().catch(console.error);
