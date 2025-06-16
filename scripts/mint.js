const hre = require("hardhat");

// Set contract address!
const CONTRACT_ADDRESS = "0xBB1Bbb2ac00a115D98948E413B9Adc15194eB803"; // <-- use your real address!

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTst", CONTRACT_ADDRESS, deployer);

  // Mint 20 NFT, no allowlist, and include the price in value
  const tx = await contract.mint(
    20,        // count
    [],       // merkleProof
    { value: hre.ethers.parseEther("0.00020") } // must match your mint price!
  );
  const receipt = await tx.wait();
  console.log("Minted! Tx hash:", receipt.hash);
}

main().catch(console.error);
