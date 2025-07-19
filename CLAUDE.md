# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@elchika-inc/js-qrcode`, a pure JavaScript QR code library optimized for Workers environments and SSR. The library provides QR code generation (SVG format) and reading functionality without external dependencies.

## Commands

### Development
- `npm run build` - Build the library using Rollup (generates UMD and ES module formats)
- `npm run dev` - Build in watch mode for development
- `npm test` - Run Jest test suite (requires 65% coverage)
- `npm test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint on source files
- `npm run format` - Format code with Prettier

### Build Outputs
- `dist/js-qrcode.js` - UMD build for CommonJS/browser
- `dist/js-qrcode.min.js` - Minified UMD build
- `dist/js-qrcode.esm.js` - ES module build

## Architecture

### Core Components

The library is structured with separation of concerns across these modules:

#### Generation Pipeline
- **`generator.js`** - Main QR code SVG generation orchestrator
- **`encoder.js`** - QR encoding logic coordinator with backward compatibility
- **`data-encoder.js`** - Data encoding (mode detection, version determination)
- **`module-builder.js`** - QR code matrix/module generation
- **`pattern-builder.js`** - QR pattern construction (finder, alignment, timing)

#### Reading Pipeline
- **`decoder.js`** - QR code reading from images (ImageData, Base64, Uint8Array)
- **`scanner.js`** - Browser camera scanning (client-side only)

#### Support
- **`utils.js`** - Image processing utilities and mathematical functions
- **`constants.js`** - QR specifications (sizes, patterns, error correction)
- **`errors.js`** - Custom error classes with error codes
- **`index.js`** - Main API with validation wrapper

### API Design

The main API surface is through the `QRCode` object:
- `QRCode.generate(data, options)` - Generate SVG QR code
- `QRCode.decode(data, options)` - Decode QR from image data
- `QRCode.Scanner` - Camera scanning class (browser environments)

### Test Structure

Tests are organized by functionality:
- **`tests/unit/`** - Component-specific tests
- **`tests/integration/`** - End-to-end API tests
- **`tests/helpers/`** - Test utilities and mocks
- **`tests/setup.js`** - Global test environment setup (ImageData, Image mocks)

The test environment uses jsdom and requires specific browser API mocks for image processing.

### Workers Optimization

The library is specifically optimized for edge runtime environments:
- No external dependencies for cold start performance
- SVG output for scalable, lightweight responses
- Memory-efficient matrix operations
- Support for various image input formats in serverless contexts

### Build Configuration

- **Rollup** generates multiple output formats (UMD, ES modules)
- **Babel** transpiles for broader compatibility
- **ESLint** enforces modern JavaScript patterns
- **Jest** with jsdom for comprehensive testing including browser APIs

## Target Environments

Primary: Cloudflare Workers, Vercel Edge Runtime, Netlify Edge Functions
Secondary: Next.js SSR, Node.js servers, browser client-side (supplementary)