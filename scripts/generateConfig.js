const fs = require("fs");
const path = require("path");

function analyzeTraits() {
  const traitsDir = path.join(__dirname, "..", "traits");
  const layerNames = fs.readdirSync(traitsDir)
    .filter(f => fs.statSync(path.join(traitsDir, f)).isDirectory())
    .filter(f => f !== ".DS_Store");

  // Sort layer names to match the order in your contract
  const sortedLayerNames = [
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

  const tiers = [];
  const traitCounts = [];

  console.log("\nAnalyzing trait folders and weights...\n");

  for (const layerName of sortedLayerNames) {
    const layerDir = path.join(traitsDir, layerName);
    if (!fs.existsSync(layerDir)) {
      console.error(`❌ Layer folder missing: ${layerDir}`);
      continue;
    }

    // Get all PNG files and sort them
    const files = fs.readdirSync(layerDir)
      .filter(f => f.toLowerCase().endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    // Extract weights from filenames
    const weights = files.map(file => {
      const weight = parseInt(file.split("#")[1]);
      if (isNaN(weight)) {
        console.error(`❌ Invalid weight in filename: ${file}`);
        return 0;
      }
      return weight;
    });

    console.log(`Layer: ${layerName}`);
    console.log(`Files (${files.length}):`);
    files.forEach((file, i) => {
      console.log(`  ${file} -> weight: ${weights[i]}`);
    });
    console.log("");

    tiers.push(weights);
    traitCounts.push(files.length);
  }

  // Generate the config
  const config = {
    COLLECTION_NAME: "Test Abs Chads",
    SYMBOL: "CHAD",
    DESCRIPTION: "The abs chad experiment: 4444 on-chain modular abs chads.",
    IMAGE_URL: "https://yourimg.com/image.png",
    BANNER_URL: "https://yourimg.com/banner.png",
    WEBSITE_URL: "https://yourwebsite.com",
    ROYALTIES_BASIS_POINTS: 600,
    ROYALTIES_ADDRESS: "0xF87a52eCdE727E13c2794E873C406D29Ae881771",
    NUM_LAYERS: sortedLayerNames.length,
    LAYER_NAMES: sortedLayerNames,
    TIERS: tiers,
    BACKGROUND_COLOR: "transparent",
    MAX_SUPPLY: 4444,
    MAX_PER_ADDRESS: 4444,
    MINT_PRICE: 0.00001
  };

  // Write the config file
  fs.writeFileSync(
    path.join(__dirname, "..", "collection_config.json"),
    JSON.stringify(config, null, 2)
  );

  console.log("\n✅ Generated collection_config.json with the following trait counts:");
  traitCounts.forEach((count, i) => {
    console.log(`${sortedLayerNames[i]}: ${count} traits`);
  });
  console.log("\nPlease verify the weights in collection_config.json match your trait files!");
}

analyzeTraits(); 