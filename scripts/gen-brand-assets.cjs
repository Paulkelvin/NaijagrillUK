// Generates favicon/app icons from the brand logo and the social-share (OG)
// image from the storefront photo. Re-run if either source asset changes:
//   node scripts/gen-brand-assets.cjs
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const LOGO = path.join(root, "public/images/naija-grill-and-spice-logo.png");
const FRONT = path.join(root, "public/images/Naija-grill-and-spice-front.webp");
const appDir = path.join(root, "src/app");
const iconsDir = path.join(root, "public/icons");

// Brand colour also used as the manifest theme/background.
const BG = { r: 255, g: 255, b: 255, alpha: 1 }; // white — best legibility at 16px

fs.mkdirSync(iconsDir, { recursive: true });

// Tightly-cropped logo (transparent borders removed) reused for every icon.
async function trimmedLogo() {
  return sharp(LOGO).trim().png().toBuffer();
}

// Square icon: logo centred on a solid background with `pad` fraction margin.
async function squareIcon(src, size, pad, background = BG) {
  const inner = Math.round(size * (1 - pad * 2));
  const margin = Math.round((size - inner) / 2);
  const logo = await sharp(src)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: logo, top: margin, left: margin }])
    .png()
    .toBuffer();
}

// Minimal ICO wrapper around a single PNG (supported by all modern browsers).
function pngToIco(pngBuffer, dim) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(dim >= 256 ? 0 : dim, 0); // width (0 == 256)
  entry.writeUInt8(dim >= 256 ? 0 : dim, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // size of PNG data
  entry.writeUInt32LE(6 + 16, 12); // offset to PNG data
  return Buffer.concat([header, entry, pngBuffer]);
}

async function run() {
  const logo = await trimmedLogo();

  // Favicon (browser tab) + classic .ico fallback.
  await sharp(await squareIcon(logo, 512, 0.06)).toFile(path.join(appDir, "icon.png"));
  const ico64 = await squareIcon(logo, 64, 0.06);
  fs.writeFileSync(path.join(appDir, "favicon.ico"), pngToIco(ico64, 64));

  // Apple touch icon (must be opaque — iOS renders transparency as black).
  await sharp(await squareIcon(logo, 180, 0.1)).toFile(path.join(appDir, "apple-icon.png"));

  // PWA / Android manifest icons.
  await sharp(await squareIcon(logo, 192, 0.08)).toFile(path.join(iconsDir, "icon-192.png"));
  await sharp(await squareIcon(logo, 512, 0.08)).toFile(path.join(iconsDir, "icon-512.png"));
  // Maskable needs the logo inside the ~80% safe zone.
  await sharp(await squareIcon(logo, 512, 0.2)).toFile(path.join(iconsDir, "maskable-512.png"));

  // Social share (Open Graph) image — standard 1200x630, JPG for compatibility.
  await sharp(FRONT)
    .resize(1200, 630, { fit: "cover", position: "top" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(root, "public/og-image.jpg"));

  console.log("Brand assets generated.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
