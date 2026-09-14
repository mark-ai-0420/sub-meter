import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// SVG template for crisp standalone favicon.svg
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="meralcoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF9E40"/>
      <stop offset="50%" stop-color="#F37021"/>
      <stop offset="100%" stop-color="#D05A0B"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#142642"/>
      <stop offset="100%" stop-color="#0B192C"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#F37021" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bgGrad)"/>
  <rect width="60" height="60" x="2" y="2" rx="12" fill="none" stroke="#F37021" stroke-width="1.5" stroke-opacity="0.3"/>
  <path d="M35 6L15 34h14l-4 24 24-30H30l5-22z" fill="url(#meralcoGradient)" filter="url(#glow)" stroke="#FFF" stroke-width="0.5" stroke-opacity="0.3"/>
</svg>`;

// Full-bleed 512x512 Master SVG for PWA icons
const pwaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#182E4B"/>
      <stop offset="50%" stop-color="#0F2038"/>
      <stop offset="100%" stop-color="#081322"/>
    </linearGradient>
    <linearGradient id="boltGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFA84A"/>
      <stop offset="45%" stop-color="#F37021"/>
      <stop offset="100%" stop-color="#D04A02"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F37021" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#3B82F6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#F37021" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="48%" r="45%">
      <stop offset="0%" stop-color="#F37021" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#F37021" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#0B192C" stop-opacity="0"/>
    </radialGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="boltShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.6"/>
      <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#F37021" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" fill="url(#bgDark)"/>

  <!-- Radial Glow behind meter dial -->
  <circle cx="256" cy="256" r="210" fill="url(#centerGlow)"/>

  <!-- Sub-meter circular dial & gauge markings -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="#223854" stroke-width="4"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="url(#ringGrad)" stroke-width="4" stroke-dasharray="24 16" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="165" fill="none" stroke="#1B2D44" stroke-width="2" stroke-dasharray="6 12"/>

  <!-- Dial ticks -->
  <g stroke="#475569" stroke-width="2" opacity="0.6">
    <line x1="256" y1="72" x2="256" y2="86"/>
    <line x1="256" y1="426" x2="256" y2="440"/>
    <line x1="72" y1="256" x2="86" y2="256"/>
    <line x1="426" y1="256" x2="440" y2="256"/>
    <line x1="126" y1="126" x2="136" y2="136"/>
    <line x1="386" y1="126" x2="376" y2="136"/>
    <line x1="126" y1="386" x2="136" y2="376"/>
    <line x1="386" y1="386" x2="376" y2="376"/>
  </g>

  <!-- Center Energy Meter Core Badge -->
  <circle cx="256" cy="256" r="135" fill="#0C1B2E" stroke="#2B4365" stroke-width="3"/>

  <!-- Iconic Lightning Bolt -->
  <g filter="url(#boltShadow)">
    <path d="M282 86L142 276h94l-32 150 166-200h-98l40-140z" fill="url(#boltGrad)" stroke="#FFE0B2" stroke-width="2" stroke-linejoin="round"/>
  </g>

  <!-- Top accent specular highlight -->
  <path d="M280 94L162 264h80l-20 80 120-144h-78l26-106z" fill="#FFF" opacity="0.18"/>
</svg>`;

// Safe-zone optimized maskable SVG (Emblem fits well within 80% circle safe zone: radius <= 204px)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBgDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#182E4B"/>
      <stop offset="50%" stop-color="#0F2038"/>
      <stop offset="100%" stop-color="#081322"/>
    </linearGradient>
    <linearGradient id="mBoltGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFA84A"/>
      <stop offset="45%" stop-color="#F37021"/>
      <stop offset="100%" stop-color="#D04A02"/>
    </linearGradient>
    <radialGradient id="mCenterGlow" cx="50%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#F37021" stop-opacity="0.3"/>
      <stop offset="60%" stop-color="#F37021" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0B192C" stop-opacity="0"/>
    </radialGradient>
    <filter id="mBoltShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.5"/>
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#F37021" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Full Bleed Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#mBgDark)"/>

  <!-- Center safe area radial glow -->
  <circle cx="256" cy="256" r="160" fill="url(#mCenterGlow)"/>

  <!-- Sub-meter circular dial scaled within safe zone (radius 150) -->
  <circle cx="256" cy="256" r="150" fill="none" stroke="#223854" stroke-width="4"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#F37021" stroke-width="4" stroke-dasharray="18 12" stroke-linecap="round" opacity="0.85"/>
  <circle cx="256" cy="256" r="130" fill="none" stroke="#1B2D44" stroke-width="2" stroke-dasharray="5 10"/>

  <!-- Inner Badge (radius 105) -->
  <circle cx="256" cy="256" r="105" fill="#0C1B2E" stroke="#2B4365" stroke-width="2.5"/>

  <!-- Lightning Bolt nicely centered in safe area (bounds ~150px to ~362px) -->
  <g filter="url(#mBoltShadow)">
    <path d="M276 122L166 270h74l-26 120 132-158h-78l32-110z" fill="url(#mBoltGrad)" stroke="#FFE0B2" stroke-width="1.8" stroke-linejoin="round"/>
  </g>
  <!-- Specular highlight -->
  <path d="M274 128L182 262h62l-16 64 96-114h-62l20-84z" fill="#FFF" opacity="0.2"/>
</svg>`;

async function generateAssets() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg.trim());
  console.log('Generated favicon.svg');

  // 2. Generate pwa-512x512.png
  await sharp(Buffer.from(pwaSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. Generate pwa-192x192.png
  await sharp(Buffer.from(pwaSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 4. Generate maskable-icon-512x512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Generated maskable-icon-512x512.png');

  // 5. Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(pwaSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
