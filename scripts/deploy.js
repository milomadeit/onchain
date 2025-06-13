const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Change 'Indelible' to your actual main contract name!
  const NFT = await hre.ethers.getContractFactory("AbsChadsTst");
  const contract = await NFT.deploy(/* constructor args if any */);

  await contract.waitForDeployment();
  console.log("Deployed to:", await contract.getAddress());
}

main().catch(console.error);


// npx hardhat run scripts/deploy.js --network base
// replace --network with desired target network
