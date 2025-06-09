// scripts/generateContract.js
const fs = require("fs");

const config = require("../collection.config.json"); // Your JSON

function arrayToSolidity(arr) {
  // handles both string[] and number[][]
  if (Array.isArray(arr[0])) {
    // Array of arrays
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

function replacePlaceholders(template, config) {
  let result = template;
  Object.keys(config).forEach(key => {
    if (Array.isArray(config[key])) {
      if (key === "LAYER_NAMES") {
        result = result.replace("{{LAYER_NAMES_ARRAY}}", arrayToSolidity(config[key]));
      } else if (key === "TIERS") {
        // Replace all TIERS initializations in constructor
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
  return result.replace(/\{\{[A-Z_]+\}\}/g, "");
}

function main() {
  const template = fs.readFileSync("./contracts/onchain.template.sol", "utf8");
  const output = replacePlaceholders(template, config);
  fs.writeFileSync("./contracts/on-chain.sol", output);
  console.log("Contract generated at ./contracts/on-chain.sol");
}

main();
