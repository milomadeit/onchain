const hre = require("hardhat");

const CONTRACT_ADDRESS = "0xBB1Bbb2ac00a115D98948E413B9Adc15194eB803";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  const contract = await hre.ethers.getContractAt("AbsChadsTst", CONTRACT_ADDRESS, deployer);
  
  // Get current mint status
  const isPublicMintActive = await contract.isPublicMintActive();
  console.log("Current public mint status:", isPublicMintActive ? "Active" : "Inactive");

  // Toggle public mint
  console.log("Toggling public mint...");
  const tx = await contract.togglePublicMint();
  await tx.wait();

  // Get new mint status
  const newMintStatus = await contract.isPublicMintActive();
  console.log("New public mint status:", newMintStatus ? "Active" : "Inactive");

  // Get mint price
  const mintPrice = await contract.publicMintPrice();
  console.log("Mint price:", hre.ethers.formatEther(mintPrice), "ETH");

  // Get max per address
  const maxPerAddress = await contract.maxPerAddress();
  console.log("Max mints per address:", maxPerAddress.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 