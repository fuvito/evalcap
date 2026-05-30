const fs = require('fs');
const path = require('path');

// PNG generation for splash screen (1242x2688 - iPhone 14 Pro Max size)
function createPNG(width, height) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

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

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter method
  ihdrData.writeUInt8(0, 12); // interlace

  // Create pixel data with gradient
  const rowSize = 1 + width * 3;
  const pixelData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    pixelData[rowOffset] = 0; // filter type: none

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Radial gradient from center
      const centerX = width / 2;
      const centerY = height / 2;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
      const ratio = dist / maxDist;

      // Gradient: #7c3aed (purple center) to #1e1b4b (dark indigo edges)
      const r = Math.round(124 + (30 - 124) * ratio);
      const g = Math.round(58 + (27 - 58) * ratio);
      const b = Math.round(237 + (75 - 237) * ratio);

      pixelData[pixelOffset] = r;
      pixelData[pixelOffset + 1] = g;
      pixelData[pixelOffset + 2] = b;
    }
  }

  // Compress using zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(pixelData, { level: 9 });

  // IDAT chunk
  const idatData = compressed;

  // IEND chunk
  const iendData = Buffer.alloc(0);

  // Build PNG
  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', idatData),
    createChunk('IEND', iendData)
  ]);
}

// Generate splash screen (1242x2688 - standard iPhone size)
const width = 1242;
const height = 2688;
const splash = createPNG(width, height);

// Save
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(path.join(assetsDir, 'splash.png'), splash);
console.log(`Splash screen generated: assets/splash.png (${width}x${height})`);
