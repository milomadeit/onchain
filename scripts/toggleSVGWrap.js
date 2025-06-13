const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x38B7C1165385f247A034eB997ef5585903502C53";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTest2", CONTRACT_ADDRESS, deployer);

  console.log("\nToggling SVG wrapping...\n");

  // Check if we're the owner
  const owner = await contract.owner();
  const isOwner = deployer.address.toLowerCase() === owner.toLowerCase();
  
  if (!isOwner) {
    console.log("❌ You are not the contract owner. Cannot toggle SVG wrapping.");
    process.exit(1);
  }

  try {
    const tx = await contract.toggleWrapSVG();
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Successfully toggled SVG wrapping");
  } catch (error) {
    console.log("❌ Error toggling SVG wrapping:", error.message);
  }
}

main().catch(console.error); 