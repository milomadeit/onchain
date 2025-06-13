const hre = require("hardhat");

const CONTRACT_ADDRESS = "0xB65FBf1087c02E0600746C755CEaC07a4cD972ec";
const TOKEN_ID = 11;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTest2", CONTRACT_ADDRESS, deployer);

  console.log("\nChecking contract settings...\n");

  // Check contract state
  const isSealed = await contract.isContractSealed();
  console.log("Contract sealed:", isSealed);

  // Get contract data
  const contractData = await contract.contractData();
  console.log("\nContract Data:");
  console.log("- Name:", contractData.name);
  console.log("- Description:", contractData.description);
  console.log("- Image:", contractData.image);
  console.log("- Banner:", contractData.banner);
  console.log("- Website:", contractData.website);
  console.log("- Royalties:", contractData.royalties);
  console.log("- Royalties Recipient:", contractData.royaltiesRecipient);

  // Get base URI
  const baseURI = await contract.baseURI();
  console.log("\nBase URI:", baseURI);

  // Check if token exists
  try {
    const owner = await contract.ownerOf(TOKEN_ID);
    console.log("\nToken", TOKEN_ID, "exists and is owned by:", owner);
  } catch (error) {
    console.log("\nToken", TOKEN_ID, "does not exist");
    process.exit(1);
  }

  // Try different ways to get the token data
  console.log("\nTrying different ways to get token data...");

  // 1. Try tokenIdToSVG
  try {
    const svg = await contract.tokenIdToSVG(TOKEN_ID);
    console.log("\n✅ tokenIdToSVG successful");
    console.log("SVG preview:", svg.slice(0, 100) + "...");
  } catch (error) {
    console.log("\n❌ tokenIdToSVG failed:", error.message);
  }

  // 2. Try hashToSVG
  try {
    const hash = await contract.tokenIdToHash(TOKEN_ID);
    console.log("\nToken hash:", hash);
    const svg = await contract.hashToSVG(hash);
    console.log("\n✅ hashToSVG successful");
    console.log("SVG preview:", svg.slice(0, 100) + "...");
  } catch (error) {
    console.log("\n❌ hashToSVG failed:", error.message);
  }

  // 3. Try tokenURI
  try {
    const uri = await contract.tokenURI(TOKEN_ID);
    console.log("\n✅ tokenURI successful");
    if (uri.startsWith("data:application/json;base64,")) {
      const b64 = uri.replace("data:application/json;base64,", "");
      const json = Buffer.from(b64, "base64").toString("utf-8");
      console.log("\nDecoded metadata JSON:");
      console.log(JSON.stringify(JSON.parse(json), null, 2));
    }
  } catch (error) {
    console.log("\n❌ tokenURI failed:", error.message);
  }

  // Check if we're the owner
  const owner = await contract.owner();
  const isOwner = deployer.address.toLowerCase() === owner.toLowerCase();
  console.log("\nContract owner:", owner);
  console.log("Your address:", deployer.address);
  console.log("Are you the owner?", isOwner);

  if (isOwner) {
    console.log("\nAvailable owner functions:");
    console.log("- toggleWrapSVG()");
    console.log("- setRenderOfTokenId(uint tokenId, bool renderOffChain)");
    console.log("- setBaseURI(string uri)");
    console.log("- sealContract()");
    console.log("- setContractData(ContractData memory data)");
  }
}

main().catch(console.error); 