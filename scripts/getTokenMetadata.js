const hre = require("hardhat");

const CONTRACT_ADDRESS = "0xBB1Bbb2ac00a115D98948E413B9Adc15194eB803";
const TOKEN_ID = 1;

async function validateMetadata(metadata) {
  const requiredFields = ['name', 'description', 'image'];
  const missingFields = requiredFields.filter(field => !metadata[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Warning: Missing required metadata fields: ${missingFields.join(', ')}`);
  }
  
  // Validate attributes format
  if (metadata.attributes) {
    if (!Array.isArray(metadata.attributes)) {
      console.warn('Warning: attributes should be an array');
    } else {
      metadata.attributes.forEach((attr, index) => {
        if (!attr.trait_type || !attr.value) {
          console.warn(`Warning: Invalid attribute at index ${index}`);
        }
      });
    }
  }
}

async function decodeBase64Metadata(uri) {
  if (!uri.startsWith('data:application/json;base64,')) {
    return null;
  }
  
  const b64 = uri.replace('data:application/json;base64,', '');
  const json = Buffer.from(b64, 'base64').toString('utf-8');
  return JSON.parse(json);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("AbsChadsTst", CONTRACT_ADDRESS, deployer);
  
  try {
    console.log(`\nFetching metadata for token ${TOKEN_ID}...`);
    
    // Get tokenURI
    const uri = await contract.tokenURI(TOKEN_ID);
    console.log('\nRaw tokenURI:', uri);
    
    // Try to decode base64 metadata
    const metadata = await decodeBase64Metadata(uri);
    
    if (metadata) {
      console.log('\nDecoded metadata:');
      console.log(JSON.stringify(metadata, null, 2));
      
      // Validate metadata structure
      await validateMetadata(metadata);
      
      // Check image handling
      if (metadata.image) {
        console.log('\nImage URL:', metadata.image);
      }
      if (metadata.image_data) {
        console.log('\nImage data is present (base64 encoded)');
      }
      if (metadata.svg_image_data) {
        console.log('\nSVG image data is present (base64 encoded)');
      }
      
      // Display attributes
      if (metadata.attributes && metadata.attributes.length > 0) {
        console.log('\nAttributes:');
        metadata.attributes.forEach(attr => {
          console.log(`- ${attr.trait_type}: ${attr.value}`);
        });
      }
    } else {
      console.log('\nToken URI is not base64 encoded. It might be an external URL.');
      console.log('URI:', uri);
    }
    
  } catch (error) {
    console.error('\nError fetching tokenURI:', error.message);
    if (error.message.includes('Invalid token')) {
      console.log('This token ID does not exist.');
    }
  }
}

main().catch(console.error); 