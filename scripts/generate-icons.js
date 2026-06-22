const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
    <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
  
  <!-- Content Shadow Group -->
  <g filter="url(#shadow)">
    <!-- Document Icon (Folded Paper) -->
    <path d="M140 120 C140 108.954 148.954 100 160 100 H280 L372 192 V392 C372 403.046 363.046 412 352 412 H160 C148.954 412 140 403.046 140 392 V120 Z" fill="#ffffff" fill-opacity="0.15" />
    <path d="M280 100 V172 C280 183.046 288.954 192 300 192 H372" fill="#ffffff" fill-opacity="0.1" />
    
    <!-- Large Stylized "A" representing AMIGO and AI -->
    <path d="M200 360 L240 230 C244 218 252 210 256 210 S268 218 272 230 L312 360" stroke="url(#sparkleGrad)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <path d="M222 300 H290" stroke="url(#sparkleGrad)" stroke-width="24" stroke-linecap="round" fill="none" />
    
    <!-- AI Sparkle / Star in top-right area -->
    <path d="M310 140 C310 151.046 318.954 160 330 160 C318.954 160 310 168.954 310 180 C310 168.954 301.046 160 290 160 C301.046 160 310 151.046 310 140 Z" fill="url(#sparkleGrad)" />
    <path d="M210 170 C210 175.523 214.477 180 220 180 C214.477 180 210 184.477 210 190 C210 184.477 205.523 180 200 180 C205.523 180 210 175.523 210 170 Z" fill="url(#sparkleGrad)" />
  </g>
</svg>
`;

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Ensure screenshots directory exists too
const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  const svgBuffer = Buffer.from(svg);

  for (const size of sizes) {
    const filename = `icon-${size}.png`;
    const destPath = path.join(iconsDir, filename);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(destPath);
    console.log(`Generated ${filename}`);
  }

  // Create a placeholder wide screenshot as referenced in manifest.json (dashboard.png)
  const screenshotSvg = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#09090b" />
    <circle cx="640" cy="360" r="300" fill="#7c3aed" opacity="0.05" filter="blur(60px)" />
    <circle cx="200" cy="200" r="150" fill="#4f46e5" opacity="0.03" filter="blur(40px)" />
    <rect x="100" y="80" width="1080" height="560" rx="24" fill="#18181b" stroke="#27272a" stroke-width="2" />
    <rect x="100" y="80" width="240" height="560" fill="#09090b" rx="24" />
    <rect x="360" y="120" width="400" height="36" rx="8" fill="#27272a" />
    <rect x="360" y="180" width="680" height="400" rx="16" fill="#09090b" stroke="#27272a" stroke-width="2" />
    <text x="640" y="380" fill="#ffffff" font-family="sans-serif" font-size="28" text-anchor="middle" font-weight="bold">AMIGO PDF</text>
    <text x="640" y="420" fill="#a1a1aa" font-family="sans-serif" font-size="16" text-anchor="middle">Your AI Study Companion</text>
  </svg>
  `;
  const screenshotDest = path.join(screenshotsDir, 'dashboard.png');
  await sharp(Buffer.from(screenshotSvg))
    .resize(1280, 720)
    .png()
    .toFile(screenshotDest);
  console.log('Generated screenshots/dashboard.png');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
