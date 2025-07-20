# @elchika-inc/js-qrcode

[![npm version](https://badge.fury.io/js/@elchika-inc/js-qrcode.svg)](https://badge.fury.io/js/@elchika-inc/js-qrcode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A pure JavaScript QR code library optimized for Workers environments and SSR. Provides QR code generation (SVG format) and reading functionality without external dependencies.

> 🇯🇵 **日本語版README**: [README.ja.md](./README.ja.md)

## Features

- ✨ **Workers Optimized**: Compatible with Cloudflare Workers, Vercel Edge Runtime, Netlify Edge Functions
- 🚀 **High Performance**: Lightweight with no external dependencies, cold start optimized
- 📱 **SVG Output**: Scalable and lightweight QR code generation
- 🔍 **QR Reading**: Image-based QR code reading support
- 🌐 **Universal**: Works in SSR, SSG, and browser environments
- 🛡️ **TypeScript**: Full type definition files included
- 📦 **Lightweight**: Minimal bundle size
- ✅ **High Compatibility**: L, M, Q error correction levels with 100% compatibility

## Installation

```bash
npm install @elchika-inc/js-qrcode
```

```bash
yarn add @elchika-inc/js-qrcode
```

```bash
pnpm add @elchika-inc/js-qrcode
```

## Quick Start

### Basic QR Code Generation

```javascript
import QRCode from '@elchika-inc/js-qrcode';

// Simple QR code generation
const svg = QRCode.generate('Hello World');
console.log(svg); // SVG format string

// Generation with custom options
const customSvg = QRCode.generate('https://example.com', {
  errorCorrectionLevel: 'M',
  margin: 4,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});
```

### QR Code Reading

```javascript
import QRCode from '@elchika-inc/js-qrcode';

// Read from ImageData
const result = await QRCode.decode(imageData);
console.log(result.data); // "Decoded text"

// Read from Base64 image
const base64Result = await QRCode.decode('data:image/png;base64,...');
```

## Usage Examples

### Cloudflare Workers

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const text = url.searchParams.get('text') || 'Hello World';
    
    const svg = QRCode.generate(text, { 
      errorCorrectionLevel: 'M',
      margin: 4 
    });
    
    return new Response(svg, {
      headers: { 
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }
};
```

### Next.js App Router API

```javascript
import QRCode from '@elchika-inc/js-qrcode';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');
  
  if (!data) {
    return Response.json({ error: 'Data required' }, { status: 400 });
  }
  
  try {
    const svg = QRCode.generate(data, {
      errorCorrectionLevel: 'M'
    });
    
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Vercel Edge Runtime

```javascript
import QRCode from '@elchika-inc/js-qrcode';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  
  const svg = QRCode.generate(text);
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}
```

### Browser Environment with Camera Scanning

```javascript
import QRCode from '@elchika-inc/js-qrcode';

// Use only in environments with camera access
const scanner = new QRCode.Scanner(videoElement);

try {
  await scanner.start();
  scanner.on('decode', (result) => {
    console.log('Scan result:', result.data);
  });
} catch (error) {
  console.error('Camera access error:', error);
}
```

## API Reference

### QRCode.generate(data, options)

Generates a QR code in SVG format.

#### Parameters

- `data` (string): Data to encode
- `options` (object, optional): Generation options
  - `errorCorrectionLevel` (string): Error correction level ('L', 'M', 'Q', 'H'). Default: 'M'
  - `margin` (number): Margin size. Default: 4
  - `color` (object): Color settings
    - `dark` (string): Dark color. Default: '#000000'
    - `light` (string): Light color. Default: '#FFFFFF'
  - `forceMask` (number, optional): Force specific mask pattern (0-7)

#### Returns

SVG format string

### QRCode.decode(data, options)

Reads QR code from image.

#### Parameters

- `data` (ImageData | string | Uint8Array): Image data
- `options` (object, optional): Decode options

#### Returns

Promise<object> - Decoded result with `data` property

## Error Correction Levels

| Level | Error Recovery | Compatibility | Recommended Use |
|-------|----------------|---------------|-----------------|
| L     | ~7%           | ✅ 100%       | Clean environments |
| M     | ~15%          | ✅ 100%       | **Default** - General use |
| Q     | ~25%          | ✅ 100%       | Noisy environments |
| H     | ~30%          | ⚠️ Limited    | **Available but may fail in some readers** |

> **Note about H Level**: While H (High) error correction level is available in the API, it may fail to read in some QR code readers due to compatibility limitations. For maximum compatibility, we recommend using L, M, or Q levels.

## Error Handling

```javascript
import QRCode from '@elchika-inc/js-qrcode';

try {
  const svg = QRCode.generate('very long text that exceeds maximum capacity...');
} catch (error) {
  if (error instanceof QRCode.errors.QRCodeGenerationError) {
    console.log('Generation error:', error.code, error.message);
  }
}
```

Available error types:
- `QRCodeGenerationError`: QR code generation errors
- `QRCodeDecodeError`: QR code reading errors
- `CameraAccessError`: Camera access errors
- `EnvironmentError`: Environment-related errors

## Browser Compatibility

- **Edge Runtime**: Cloudflare Workers, Vercel Edge Runtime, Netlify Edge Functions
- **Node.js**: 18.0.0 or higher
- **Browser**: Modern browsers with ES2020 support
- **TypeScript**: 4.5 or higher

## Development

### Local Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Start local demo server
npx serve . # or python -m http.server
# Open http://localhost:3000/index.html
```

### Project Structure

```
js-qrcode/
├── src/           # Library source code
├── dist/          # Built files
├── tests/         # Test suite
├── index.html     # Demo page
└── README.md      # This file
```

## Contributing

Issues and pull requests are welcome.

## License

MIT License - See [LICENSE](./LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/elchika-inc/workers-qrcode)
- [npm Package](https://www.npmjs.com/package/@elchika-inc/js-qrcode)
- [Bug Reports](https://github.com/elchika-inc/workers-qrcode/issues)