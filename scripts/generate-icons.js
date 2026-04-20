/**
 * FarmerApp Icon Generator — "Harvest Badge" Design
 * Generates master 1024px icon once, then resizes to all required sizes.
 * Run: node scripts/generate-icons.js
 */
const { Jimp } = require('jimp');
const path = require('path');
const fs   = require('fs');

const SIZE = 1024;

// ── Color helper ───────────────────────────────────────────────────────────
function c(r, g, b, a = 255) {
  return ((r & 0xff) << 24 | (g & 0xff) << 16 | (b & 0xff) << 8 | (a & 0xff)) >>> 0;
}
const TRANSPARENT = 0x00000000;

// ── Pixel primitives ───────────────────────────────────────────────────────
function px(img, x, y, color) {
  if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) img.setPixelColor(color, x, y);
}
function circle(img, cx, cy, r, color) {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      if (dx * dx + dy * dy <= r2) px(img, cx + dx, cy + dy, color);
}
function ellipse(img, cx, cy, rx, ry, color) {
  for (let dy = -ry; dy <= ry; dy++)
    for (let dx = -rx; dx <= rx; dx++)
      if ((dx / rx) ** 2 + (dy / ry) ** 2 <= 1) px(img, cx + dx, cy + dy, color);
}
function rotEllipse(img, cx, cy, rx, ry, deg, color) {
  const a = (deg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const m = Math.ceil(Math.max(rx, ry) * 1.1);
  for (let dy = -m; dy <= m; dy++)
    for (let dx = -m; dx <= m; dx++) {
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      if ((lx / rx) ** 2 + (ly / ry) ** 2 <= 1) px(img, cx + dx, cy + dy, color);
    }
}
function line(img, x0, y0, x1, y1, w, color) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.ceil(Math.hypot(dx, dy));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    circle(img, Math.round(x0 + dx * t), Math.round(y0 + dy * t), w >> 1, color);
  }
}
function ring(img, cx, cy, r1, r2, color) {
  const r12 = r1 * r1, r22 = r2 * r2;
  for (let dy = -r2; dy <= r2; dy++)
    for (let dx = -r2; dx <= r2; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 >= r12 && d2 <= r22) px(img, cx + dx, cy + dy, color);
    }
}

// ── Radial gradient background ─────────────────────────────────────────────
function gradBg(img) {
  const cx = 512, cy = 512, r = 512;
  // inner: #165020  outer: #08280C
  const [ri,gi,bi] = [22, 80, 32];
  const [ro,go,bo] = [8,  40, 12];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
      if (d > r) continue;
      const t = d / r;
      img.setPixelColor(c(
        Math.round(ri + (ro - ri) * t),
        Math.round(gi + (go - gi) * t),
        Math.round(bi + (bo - bi) * t)
      ), x, y);
    }
  }
}

// ── Clip to circle ─────────────────────────────────────────────────────────
function clipCircle(img, safeRatio = 1.0) {
  const cx = 512, cy = 512, r = 512 * safeRatio, r2 = r * r;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r2) img.setPixelColor(TRANSPARENT, x, y);
    }
}

// ══════════════════════════════════════════════════════════════════════════
//  PAINT MASTER ICON (1024 × 1024)
// ══════════════════════════════════════════════════════════════════════════
function paintMaster(isAdaptiveFg = false) {
  const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });

  if (!isAdaptiveFg) {
    gradBg(img);

    // Subtle sky glow (top half)
    for (let r2 = 420; r2 >= 380; r2 -= 10) {
      const a = Math.round(18 * (1 - (r2 - 380) / 40));
      circle(img, 512, 220, r2, c(200, 240, 80, a));
    }
  }

  // ── Earth arc ───────────────────────────────────────────────────────────
  ellipse(img, 512, 840, 310, 100, c(70, 38, 8));
  ellipse(img, 512, 820, 285,  82, c(101, 58, 18));
  ellipse(img, 512, 808, 255,  60, c(120, 72, 24));

  // ── Wheat stalks ────────────────────────────────────────────────────────
  const LEAF  = c(235, 255, 228);
  const LEAF2 = c(195, 235, 185);

  function stalk(sx, sy, topY, leafAngle, lx, ly, col) {
    line(img, sx, sy, sx + lx * 0.15, topY, 20, col);
    // two angled leaves
    rotEllipse(img, sx - 65 + lx * 0.3, sy - 290, 105, 34, -leafAngle, col);
    rotEllipse(img, sx + 65 + lx * 0.3, sy - 290, 105, 34,  leafAngle, col);
    // grain head
    ellipse(img, sx + lx * 0.15, topY, 30, 78, col);
    for (let i = 0; i < 6; i++) {
      const gy = topY + 78 - i * 26;
      ellipse(img, sx + lx * 0.15 - 20, gy, 16, 10, c(160, 200, 150));
      ellipse(img, sx + lx * 0.15 + 20, gy, 16, 10, c(160, 200, 150));
    }
  }

  stalk(340, 800,  320,  38,  -30, 0, LEAF2); // left
  stalk(684, 800,  320, -38,   30, 0, LEAF2); // right
  stalk(512, 820,  270,  36,    0, 0, LEAF);  // center (tallest)

  // ── Sun ─────────────────────────────────────────────────────────────────
  const sunX = 512, sunY = 200, sunR = 82;
  // glow rings
  circle(img, sunX, sunY, sunR + 50, c(255, 200, 0, 30));
  circle(img, sunX, sunY, sunR + 30, c(255, 210, 0, 55));
  // rays
  for (let deg = 0; deg < 360; deg += 45) {
    const rad = (deg * Math.PI) / 180;
    line(img,
      Math.round(sunX + (sunR + 10) * Math.cos(rad)),
      Math.round(sunY + (sunR + 10) * Math.sin(rad)),
      Math.round(sunX + (sunR + 58) * Math.cos(rad)),
      Math.round(sunY + (sunR + 58) * Math.sin(rad)),
      16, c(255, 215, 0)
    );
  }
  // disc
  circle(img, sunX, sunY, sunR, c(255, 220, 30));
  // highlight
  circle(img, sunX - 22, sunY - 22, 28, c(255, 248, 180, 130));

  // ── Badge ring ───────────────────────────────────────────────────────────
  if (!isAdaptiveFg) {
    ring(img, 512, 512, 468, 498, c(245, 168, 20));    // gold ring
    ring(img, 512, 512, 451, 457, c(200, 140, 10, 90)); // inner accent
    ring(img, 512, 512, 499, 505, c(255, 240, 180, 70)); // outer shine
  }

  // ── Clip ─────────────────────────────────────────────────────────────────
  clipCircle(img, isAdaptiveFg ? 0.70 : 1.0);

  return img;
}

// ── Size tables ────────────────────────────────────────────────────────────
const ANDROID_LAUNCHER = [
  { folder: 'mipmap-mdpi',    size: 48  },
  { folder: 'mipmap-hdpi',    size: 72  },
  { folder: 'mipmap-xhdpi',   size: 96  },
  { folder: 'mipmap-xxhdpi',  size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];
const ANDROID_FG = [
  { folder: 'mipmap-mdpi',    size: 108 },
  { folder: 'mipmap-hdpi',    size: 162 },
  { folder: 'mipmap-xhdpi',   size: 216 },
  { folder: 'mipmap-xxhdpi',  size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];
const IOS_SIZES = [
  { name: 'Icon-20@1x.png',   size: 20  },
  { name: 'Icon-20@2x.png',   size: 40  },
  { name: 'Icon-20@3x.png',   size: 60  },
  { name: 'Icon-29@1x.png',   size: 29  },
  { name: 'Icon-29@2x.png',   size: 58  },
  { name: 'Icon-29@3x.png',   size: 87  },
  { name: 'Icon-40@1x.png',   size: 40  },
  { name: 'Icon-40@2x.png',   size: 80  },
  { name: 'Icon-40@3x.png',   size: 120 },
  { name: 'Icon-60@2x.png',   size: 120 },
  { name: 'Icon-60@3x.png',   size: 180 },
  { name: 'Icon-76@1x.png',   size: 76  },
  { name: 'Icon-76@2x.png',   size: 152 },
  { name: 'Icon-83.5@2x.png', size: 167 },
  { name: 'Icon-1024.png',    size: 1024 },
];

// ── Resize helper (clone master and resize) ────────────────────────────────
async function resized(master, size) {
  if (size === SIZE) return master;
  const clone = master.clone();
  clone.resize({ w: size, h: size });
  return clone;
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════════════
(async () => {
  console.log('\n🌾  FarmerApp  ·  Harvest Badge Icon Generator\n');

  // Paint masters once at 1024px
  process.stdout.write('⏳  Painting master (normal)…');
  const master = paintMaster(false);
  console.log(' done');
  process.stdout.write('⏳  Painting master (adaptive fg)…');
  const masterFg = paintMaster(true);
  console.log(' done\n');

  // Expo source assets
  console.log('💾  Expo assets');
  await master.write(path.resolve('assets/icon.png'));
  await masterFg.write(path.resolve('assets/adaptive-icon.png'));
  await master.write(path.resolve('assets/splash-icon.png'));
  await master.write(path.resolve('assets/favicon.png'));
  console.log('    ✅ assets/icon.png  ✅ adaptive-icon.png  ✅ splash-icon.png\n');

  const resBase = path.resolve('android/app/src/main/res');

  // Android launcher
  console.log('🤖  Android launcher');
  for (const { folder, size } of ANDROID_LAUNCHER) {
    const img = await resized(master, size);
    await img.write(path.join(resBase, folder, 'ic_launcher.png'));
    await img.write(path.join(resBase, folder, 'ic_launcher_round.png'));
    console.log(`    ✅ ${folder}  ${size}px`);
  }

  // Android adaptive foreground
  console.log('\n🤖  Android adaptive foreground');
  for (const { folder, size } of ANDROID_FG) {
    const img = await resized(masterFg, size);
    await img.write(path.join(resBase, folder, 'ic_launcher_foreground.png'));
    console.log(`    ✅ ${folder}  ${size}px`);
  }

  // Remove old webp
  for (const { folder } of ANDROID_LAUNCHER) {
    ['ic_launcher.webp','ic_launcher_foreground.webp','ic_launcher_round.webp'].forEach(f => {
      const fp = path.join(resBase, folder, f);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    });
  }
  console.log('\n    🗑️  Old .webp files removed\n');

  // Android XML
  const anydpiDir = path.join(resBase, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });
  const adXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adXml);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adXml);

  // colors.xml
  const colorsPath = path.join(resBase, 'values', 'colors.xml');
  if (fs.existsSync(colorsPath)) {
    let col = fs.readFileSync(colorsPath, 'utf8');
    if (col.includes('iconBackground'))
      col = col.replace(/<color name="iconBackground">[^<]*<\/color>/, '<color name="iconBackground">#165020</color>');
    else
      col = col.replace('</resources>', '    <color name="iconBackground">#165020</color>\n</resources>');
    fs.writeFileSync(colorsPath, col);
  }
  console.log('📄  Android XML + colors updated\n');

  // iOS
  console.log('🍎  iOS icons');
  const iosDir = path.resolve('ios/FarmerApp/Images.xcassets/AppIcon.appiconset');
  fs.mkdirSync(iosDir, { recursive: true });
  for (const { name, size } of IOS_SIZES) {
    const img = await resized(master, size);
    await img.write(path.join(iosDir, name));
    console.log(`    ✅ ${name}  ${size}px`);
  }

  // Contents.json
  const contentsJson = {
    images: [
      { idiom:'iphone', scale:'2x', size:'20x20',      filename:'Icon-20@2x.png'   },
      { idiom:'iphone', scale:'3x', size:'20x20',      filename:'Icon-20@3x.png'   },
      { idiom:'iphone', scale:'2x', size:'29x29',      filename:'Icon-29@2x.png'   },
      { idiom:'iphone', scale:'3x', size:'29x29',      filename:'Icon-29@3x.png'   },
      { idiom:'iphone', scale:'2x', size:'40x40',      filename:'Icon-40@2x.png'   },
      { idiom:'iphone', scale:'3x', size:'40x40',      filename:'Icon-40@3x.png'   },
      { idiom:'iphone', scale:'2x', size:'60x60',      filename:'Icon-60@2x.png'   },
      { idiom:'iphone', scale:'3x', size:'60x60',      filename:'Icon-60@3x.png'   },
      { idiom:'ipad',   scale:'1x', size:'20x20',      filename:'Icon-20@1x.png'   },
      { idiom:'ipad',   scale:'2x', size:'20x20',      filename:'Icon-20@2x.png'   },
      { idiom:'ipad',   scale:'1x', size:'29x29',      filename:'Icon-29@1x.png'   },
      { idiom:'ipad',   scale:'2x', size:'29x29',      filename:'Icon-29@2x.png'   },
      { idiom:'ipad',   scale:'1x', size:'40x40',      filename:'Icon-40@1x.png'   },
      { idiom:'ipad',   scale:'2x', size:'40x40',      filename:'Icon-40@2x.png'   },
      { idiom:'ipad',   scale:'1x', size:'76x76',      filename:'Icon-76@1x.png'   },
      { idiom:'ipad',   scale:'2x', size:'76x76',      filename:'Icon-76@2x.png'   },
      { idiom:'ipad',   scale:'2x', size:'83.5x83.5',  filename:'Icon-83.5@2x.png' },
      { idiom:'ios-marketing', scale:'1x', size:'1024x1024', filename:'Icon-1024.png' },
    ],
    info: { author:'xcode', version:1 },
  };
  fs.writeFileSync(path.join(iosDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
  console.log('    ✅ Contents.json\n');

  console.log('✅  All icons generated!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋  REBUILD COMMANDS\n');
  console.log('  Android:');
  console.log('    cd android && ./gradlew clean && cd ..');
  console.log('    npx expo run:android\n');
  console.log('  iOS:');
  console.log('    cd ios && pod install && cd ..');
  console.log('    npx expo run:ios\n');
  console.log('  Cache reset (if old icon persists):');
  console.log('    npx expo start --clear');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
