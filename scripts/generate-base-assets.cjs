const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1. Icon SVG (1024x1024)
const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="200" fill="#0d0221"/>
  <circle cx="512" cy="512" r="420" fill="none" stroke="#ff007f" stroke-width="24"/>
  <circle cx="512" cy="512" r="380" fill="none" stroke="#00f3ff" stroke-width="12" stroke-dasharray="20 10"/>
  <!-- Runner Silhouette -->
  <circle cx="512" cy="340" r="80" fill="#00f3ff"/>
  <rect x="450" y="440" width="124" height="240" rx="30" fill="#00f3ff"/>
  <rect x="360" y="470" width="60" height="180" rx="20" fill="#ff007f"/>
  <rect x="604" y="520" width="60" height="180" rx="20" fill="#00f3ff"/>
  <rect x="420" y="690" width="70" height="200" rx="20" fill="#00f3ff"/>
  <rect x="534" y="690" width="70" height="200" rx="20" fill="#ff007f"/>
</svg>
`;

// 2. Splash Screen SVG (2732x2732)
const splashSvg = `
<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#0d0221"/>
  <!-- Retro Horizon Sun -->
  <circle cx="1366" cy="1200" r="500" fill="#ff007f"/>
  <rect x="700" y="1100" width="1332" height="30" fill="#0d0221"/>
  <rect x="700" y="1200" width="1332" height="40" fill="#0d0221"/>
  <rect x="700" y="1300" width="1332" height="50" fill="#0d0221"/>
  <rect x="700" y="1400" width="1332" height="60" fill="#0d0221"/>
  <!-- Title Text -->
  <text x="1366" y="1900" font-family="monospace, sans-serif" font-size="140" font-weight="bold" fill="#00f3ff" text-anchor="middle" letter-spacing="20">GHOST RUNNER</text>
  <text x="1366" y="2050" font-family="sans-serif" font-size="60" fill="#ff007f" text-anchor="middle" letter-spacing="10">HYBRID FITNESS ENGINE</text>
</svg>
`;

async function generate() {
  try {
    const sharp = require('sharp');
    await sharp(Buffer.from(iconSvg)).png().toFile(path.join(assetsDir, 'icon.png'));
    await sharp(Buffer.from(splashSvg)).png().toFile(path.join(assetsDir, 'splash.png'));
    console.log('✅ Base icon.png (1024x1024) and splash.png (2732x2732) generated!');
  } catch (err) {
    console.error('Sharp generation error:', err);
  }
}

generate();
