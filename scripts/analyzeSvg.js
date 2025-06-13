const fs = require('fs');
const path = require('path');

const SVGS_DIR = path.join(__dirname, '..', 'svgs');

function analyzeSvg(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`\nAnalyzing ${path.basename(filePath)}:`);
    console.log('----------------------------------------');
    console.log('First 500 characters:');
    console.log(content.slice(0, 500));
    console.log('\nSVG Structure:');
    
    // Check for common SVG elements
    const hasViewBox = content.includes('viewBox');
    const hasWidth = content.includes('width=');
    const hasHeight = content.includes('height=');
    const hasImage = content.includes('<image');
    const hasBackground = content.includes('background');
    const hasBase64 = content.includes('base64');
    
    console.log(`- Has viewBox: ${hasViewBox}`);
    console.log(`- Has width: ${hasWidth}`);
    console.log(`- Has height: ${hasHeight}`);
    console.log(`- Has image tag: ${hasImage}`);
    console.log(`- Has background: ${hasBackground}`);
    console.log(`- Has base64: ${hasBase64}`);
    
    // Try to find the actual image data
    const imageMatch = content.match(/<image[^>]*href="([^"]+)"/);
    if (imageMatch) {
        console.log('\nFound image href:', imageMatch[1].slice(0, 100) + '...');
    }
    
    console.log('----------------------------------------\n');
}

// Analyze the first SVG file in the directory
const files = fs.readdirSync(SVGS_DIR)
    .filter(file => file.toLowerCase().endsWith('.svg'));

if (files.length > 0) {
    analyzeSvg(path.join(SVGS_DIR, files[0]));
} else {
    console.log('No SVG files found!');
} 