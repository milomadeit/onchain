// scripts/create_contract.js
const fs = require("fs");
const path = require("path");

const config = require("../collection_config.json");

function arrayToSolidity(arr) {
  if (Array.isArray(arr[0])) {
    return arr
      .map(
        subArr =>
          "[" +
          subArr.map(x => (typeof x === "string" ? `"${x}"` : x)).join(",") +
          "]"
      )
      .join(";");
  } else {
    return "[" + arr.map(x => (typeof x === "string" ? `"${x}"` : x)).join(",") + "]";
  }
}

// SAFETY CHECK: All required config fields
const requiredKeys = [
  "LAYER_NAMES", "TIERS", "NUM_LAYERS", "MAX_SUPPLY", "COLLECTION_NAME", "SYMBOL"
  // add others as you wish
];
for (const key of requiredKeys) {
  if (!(key in config)) {
    throw new Error(`Missing required config field: ${key}`);
  }
}

// SAFETY CHECK: LAYER_NAMES and TIERS arrays match
if (config.LAYER_NAMES.length !== config.TIERS.length) {
  throw new Error(
    `LAYER_NAMES and TIERS length mismatch: ${config.LAYER_NAMES.length} vs ${config.TIERS.length}`
  );
}

// SAFETY CHECK: If you have trait folders, confirm trait file count = TIERS[n].length
// (Optional, only if your traits are organized already)
for (let i = 0; i < config.LAYER_NAMES.length; i++) {
  const traitFolder = path.join(__dirname, "..", "traits", config.LAYER_NAMES[i]);
  if (fs.existsSync(traitFolder)) {
    const files = fs.readdirSync(traitFolder).filter(f => f.endsWith(".svg") || f.endsWith(".png"));
    if (files.length !== config.TIERS[i].length) {
      throw new Error(
        `Layer "${config.LAYER_NAMES[i]}" has ${files.length} trait files but TIERS[${i}] has ${config.TIERS[i].length} entries`
      );
    }
  }
}

function replacePlaceholders(template, config) {
  let result = template;
  Object.keys(config).forEach(key => {
    if (Array.isArray(config[key])) {
      if (key === "LAYER_NAMES") {
        result = result.replace("{{LAYER_NAMES_ARRAY}}", arrayToSolidity(config[key]));
      } else if (key === "TIERS") {
        const tiersString = config[key]
          .map((tierArr, idx) => `TIERS[${idx}] = [${tierArr.join(",")}];`)
          .join("\n        ");
        result = result.replace("{{TIERS_ARRAYS}}", tiersString);
      }
    } else {
      result = result.replaceAll(`{{${key}}}`, config[key]);
    }
  });
  // Remove unused placeholders just in case
  result = result.replace(/\{\{[A-Z_]+\}\}/g, "");
  // Final safety check: Warn if any curly braces remain
  if (result.includes("{{") || result.includes("}}")) {
    throw new Error("Template still contains unreplaced placeholders!");
  }
  return result;
}

function main() {
  const template = fs.readFileSync("./contracts/onchain.template.sol", "utf8");
  const output = replacePlaceholders(template, config);
  fs.writeFileSync("./contracts/on-chain.sol", output);
  console.log("✅ Contract generated at ./contracts/on-chain.sol");
}

main();
