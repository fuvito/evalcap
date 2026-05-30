const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG signature
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  const crcData = Buffer.concat([typeBuffer, data]);
  crcBuffer.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function createPNG(width, height, pixelFn) {
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter method
  ihdrData.writeUInt8(0, 12); // interlace

  // Create pixel data
  const rowSize = 1 + width * 3;
  const pixelData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    pixelData[rowOffset] = 0; // filter type: none

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      const [r, g, b] = pixelFn(x, y, width, height);
      pixelData[pixelOffset] = r;
      pixelData[pixelOffset + 1] = g;
      pixelData[pixelOffset + 2] = b;
    }
  }

  // Compress
  const compressed = zlib.deflateSync(pixelData, { level: 9 });

  // Build PNG
  return Buffer.concat([
    PNG_SIGNATURE,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// Gradient generators
function gradientIcon(x, y, w, h) {
  const ratio = (x / w + y / h) / 2;
  const r = Math.round(124 + (79 - 124) * ratio);
  const g = Math.round(58 + (70 - 58) * ratio);
  const b = Math.round(237 + (229 - 237) * ratio);
  return [r, g, b];
}

function radialSplash(x, y, w, h) {
  const cx = w / 2, cy = h / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const maxDist = Math.sqrt(cx ** 2 + cy ** 2);
  const ratio = dist / maxDist;
  const r = Math.round(124 + (30 - 124) * ratio);
  const g = Math.round(58 + (27 - 58) * ratio);
  const b = Math.round(237 + (75 - 237) * ratio);
  return [r, g, b];
}

function solidPurple(x, y, w, h) {
  return [124, 58, 237]; // #7c3aed
}

// Generate all assets
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Generating assets...');

// icon.png - 1024x1024
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPNG(1024, 1024, gradientIcon));
console.log('✓ icon.png (1024x1024)');

// splash.png - 1242x2688
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPNG(1242, 2688, radialSplash));
console.log('✓ splash.png (1242x2688)');

// adaptive-icon.png - 1024x1024 (Android)
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPNG(1024, 1024, gradientIcon));
console.log('✓ adaptive-icon.png (1024x1024)');

// favicon.png - 48x48
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), createPNG(48, 48, gradientIcon));
console.log('✓ favicon.png (48x48)');

console.log('\nAll assets generated in assets/ directory');
