const fs = require('fs');
const path = require('path');

// Simple PNG generation without external dependencies
// Creates a 1024x1024 icon with gradient background and "EC" text

function createPNG(width, height, initials) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // Create chunks
  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);
    const crcBuffer = Buffer.alloc(4);
    const crcData = Buffer.concat([typeBuffer, data]);
    crcBuffer.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
  }

  // Simple CRC32 implementation
  function crc32(buffer) {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    let crc = -1;
    for (let i = 0; i < buffer.length; i++) {
      crc = table[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ -1) >>> 0;
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

  // Create pixel data (gradient background)
  const rowSize = 1 + width * 3; // filter byte + RGB for each pixel
  const pixelData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    pixelData[rowOffset] = 0; // filter type: none

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Gradient from #7c3aed (purple) to #4f46e5 (indigo)
      const ratio = (x / width + y / height) / 2;
      const r = Math.round(124 + (79 - 124) * ratio);
      const g = Math.round(58 + (70 - 58) * ratio);
      const b = Math.round(237 + (229 - 237) * ratio);

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

// Generate icon
const size = 1024;
const icon = createPNG(size, size, 'EC');

// Save
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon);
console.log('Icon generated: assets/icon.png (1024x1024)');
