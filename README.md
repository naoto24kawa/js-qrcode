# @elchika-inc/js-qrcode

[![npm version](https://badge.fury.io/js/@elchika-inc/js-qrcode.svg)](https://badge.fury.io/js/@elchika-inc/js-qrcode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A pure JavaScript QR code library optimized for Workers environments and SSR. Provides QR code generation (SVG format) without external dependencies, featuring advanced error handling and analytics.

> 🇯🇵 **日本語版README**: [README.ja.md](./README.ja.md)

## Features

- ✨ **Workers Optimized**: Compatible with Cloudflare Workers, Vercel Edge Runtime, Netlify Edge Functions
- 🚀 **High Performance**: Lightweight with no external dependencies, cold start optimized
- 📱 **SVG Output**: Scalable and lightweight QR code generation
- 🌐 **Universal**: Works in SSR, SSG, and browser environments
- 🛡️ **TypeScript**: Full type definition files included
- 📦 **Lightweight**: Minimal bundle size
- ✅ **High Compatibility**: L, M, Q error correction levels with 100% compatibility
- 🔧 **Advanced Error Handling**: Structured error information with custom handlers and analytics
- 📊 **Error Analytics**: Real-time error tracking, classification, and reporting
- 🎯 **Error Routing**: Intelligent error classification and automated recovery suggestions

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


### Advanced Error Handling

```javascript
import QRCode from '@elchika-inc/js-qrcode';

// Basic usage (backwards compatible)
const svg = QRCode.generate('Hello World');

// Advanced usage with error analytics
const svgWithAnalytics = await QRCode.generateWithAnalytics('Hello World', {
  errorCorrectionLevel: 'M',
  margin: 4
});

// Custom error handling
QRCode.onError('DATA_TOO_LONG', (error, context) => {
  console.log('Data too long:', context.input.dataLength);
  console.log('Suggestions:', error.suggestions);
  return error;
});

// Global error handler
QRCode.onAllErrors((error, context) => {
  console.log('Error occurred:', error.code);
  // Send to monitoring service
  sendToMonitoring(error.toJSON());
  return error;
});

// Error analytics
const stats = QRCode.getErrorStats();
console.log('Total errors:', stats.total);
console.log('Error patterns:', stats.patterns);
```

## Usage Examples

### Cloudflare Workers with Error Handling

```javascript
import QRCode from '@elchika-inc/js-qrcode';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const text = url.searchParams.get('text') || 'Hello World';
    
    try {
      // Use analytics version for better error tracking
      const svg = await QRCode.generateWithAnalytics(text, { 
        errorCorrectionLevel: 'M',
        margin: 4 
      });
      
      return new Response(svg, {
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    } catch (error) {
      // Log error statistics for monitoring
      const stats = QRCode.getErrorStats();
      console.log('Error stats:', stats);
      
      return new Response(JSON.stringify({
        error: error.getUserMessage ? error.getUserMessage() : error.message,
        code: error.code,
        suggestions: error.suggestions
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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


## API Reference

### Core Generation Methods

#### QRCode.generate(data, options)

Basic QR code generation (synchronous, backwards compatible).

**Parameters:**
- `data` (string): Data to encode
- `options` (object, optional): Generation options
  - `errorCorrectionLevel` (string): Error correction level ('L', 'M', 'Q', 'H'). Default: 'M'
  - `margin` (number): Margin size. Default: 4
  - `color` (object): Color settings
    - `dark` (string): Dark color. Default: '#000000'
    - `light` (string): Light color. Default: '#FFFFFF'
  - `forceMask` (number, optional): Force specific mask pattern (0-7)
  - `returnObject` (boolean): Return detailed object instead of SVG string. Default: false

**Returns:** SVG format string (or object if `returnObject: true`)

#### QRCode.generateWithAnalytics(data, options)

Advanced QR code generation with error analytics and handling (asynchronous).

**Parameters:** Same as `generate()` method

**Returns:** Promise<string> - SVG format string (or object if `returnObject: true`)


### Error Handling API

#### QRCode.onError(errorCodeOrType, handler)

Register custom error handler for specific error codes or types.

```javascript
// Handle specific error code
QRCode.onError('DATA_TOO_LONG', (error, context) => {
  console.log('Data length:', context.input.dataLength);
  return error;
});

// Handle error type
QRCode.onError(QRCode.errors.QRCodeGenerationError, (error, context) => {
  console.log('Generation error:', error.code);
  return error;
});
```

#### QRCode.onAllErrors(handler)

Register global error handler (fallback).

```javascript
QRCode.onAllErrors((error, context) => {
  console.log('Unhandled error:', error.code);
  return error;
});
```

#### QRCode.useErrorMiddleware(middleware)

Add error processing middleware.

```javascript
QRCode.useErrorMiddleware((error, context) => {
  // Log to external service
  logger.error(error.toJSON());
  return error;
});
```

### Error Analytics API

#### QRCode.getErrorStats()

Get error statistics and analytics.

**Returns:**
```javascript
{
  total: number,
  byType: { [errorType]: count },
  byCode: { [errorCode]: count },
  patterns: Array<[pattern, count]>,
  recentErrors: Array<ErrorSummary>
}
```

#### QRCode.clearErrorHistory()

Clear all error history and statistics.

#### QRCode.classifyError(error)

Classify error by severity, category, and recoverability.

**Returns:**
```javascript
{
  severity: 'low' | 'medium' | 'high' | 'critical',
  category: 'generation' | 'environment' | 'validation',
  recoverable: boolean,
  userFacing: boolean,
  retryable: boolean
}
```

### Error Routing API

#### QRCode.addErrorRoute(criteria, handler)

Add custom error routing rules.

```javascript
QRCode.addErrorRoute({ severity: 'high' }, (error, context) => {
  // Send alert to monitoring system
  alertSystem.notify(error);
  return error;
});

QRCode.addErrorRoute({ recoverable: true }, (error, context) => {
  // Provide recovery suggestions
  error.suggestions = generateRecoverySuggestions(error);
  return error;
});
```

#### QRCode.addSeverityRule(errorCode, severity)

Add custom severity classification rules.

```javascript
QRCode.addSeverityRule('CUSTOM_ERROR', 'critical');
```

### Error Factory API

#### QRCode.createError(type, code, message, details, context)

Create custom structured errors.

```javascript
const customError = QRCode.createError(
  'generation',
  'CUSTOM_ERROR',
  'Custom error occurred',
  { customField: 'value' },
  new QRCode.errors.ErrorContext().withOperation('custom')
);
```

## Error Correction Levels

| Level | Error Recovery | Compatibility | Recommended Use |
|-------|----------------|---------------|-----------------|
| L     | ~7%           | ✅ 100%       | Clean environments |
| M     | ~15%          | ✅ 100%       | **Default** - General use |
| Q     | ~25%          | ✅ 100%       | Noisy environments |
| H     | ~30%          | ⚠️ Limited    | **Available but may fail in some readers** |

> **Note about H Level**: While H (High) error correction level is available in the API, it may fail to read in some QR code readers due to compatibility limitations. For maximum compatibility, we recommend using L, M, or Q levels.

## Advanced Error Handling Features

### Error Types and Codes

The library provides structured error information with detailed context:

```javascript
import QRCode from '@elchika-inc/js-qrcode';

try {
  const svg = QRCode.generate('very long text that exceeds maximum capacity...');
} catch (error) {
  if (error instanceof QRCode.errors.QRCodeGenerationError) {
    console.log('Error code:', error.code);
    console.log('User message:', error.getUserMessage());
    console.log('Technical details:', error.details);
    console.log('Timestamp:', error.timestamp);
    console.log('Context:', error.details.context);
  }
}
```

**Available Error Types:**
- `QRCodeGenerationError`: QR code generation errors
  - `INVALID_DATA`, `DATA_TOO_LONG`, `INVALID_OPTIONS`, `ENCODING_FAILED`, `RENDERING_FAILED`
- `EnvironmentError`: Environment-related errors
  - `UNSUPPORTED_BROWSER`, `MISSING_DEPENDENCIES`, `SECURITY_RESTRICTION`
- `ValidationError`: Input validation errors
  - `INVALID_PARAMETER`, `MISSING_REQUIRED_FIELD`, `TYPE_MISMATCH`, `VALUE_OUT_OF_RANGE`

### Production Error Monitoring

```javascript
// Setup error monitoring for production
QRCode.onAllErrors((error, context) => {
  // Send to monitoring service (e.g., Sentry, DataDog)
  monitoringService.captureException(error, {
    tags: {
      operation: context.operation,
      errorCode: error.code,
      severity: error.classification?.severity
    },
    extra: {
      context: context,
      userAgent: context.environment?.userAgent,
      inputLength: context.input?.dataLength
    }
  });
  
  return error;
});

// Handle high-severity errors specially
QRCode.addErrorRoute({ severity: 'critical' }, (error, context) => {
  // Immediate alert for critical errors
  alerting.sendPagerDutyAlert({
    message: `Critical QR code error: ${error.code}`,
    details: error.toJSON()
  });
  
  return error;
});
```

### Error Recovery Patterns

```javascript
// Automatic retry with fallback options
async function generateQRWithRetry(data, options = {}) {
  const fallbackOptions = [
    { ...options, errorCorrectionLevel: 'L' },
    { ...options, errorCorrectionLevel: 'M' },
    { ...options, errorCorrectionLevel: 'Q' }
  ];
  
  for (const opts of fallbackOptions) {
    try {
      return await QRCode.generateWithAnalytics(data, opts);
    } catch (error) {
      if (error.code === 'DATA_TOO_LONG' && opts !== fallbackOptions[fallbackOptions.length - 1]) {
        console.log(`Retrying with ${opts.errorCorrectionLevel} level...`);
        continue;
      }
      throw error;
    }
  }
}

// User-friendly error messages
QRCode.onError('DATA_TOO_LONG', (error, context) => {
  error.userFriendlyMessage = `Your text is too long (${context.input.dataLength} characters). Please shorten it to under 2900 characters.`;
  error.suggestions = [
    'Remove unnecessary text',
    'Use URL shortening services for links',
    'Split into multiple QR codes'
  ];
  return error;
});
```

## Browser Compatibility

- **Edge Runtime**: Cloudflare Workers, Vercel Edge Runtime, Netlify Edge Functions
- **Node.js**: 18.0.0 or higher
- **Browser**: Modern browsers with ES2020 support
- **TypeScript**: 4.5 or higher

## Examples and Demos

Comprehensive examples are available in the repository:

- **Basic Usage**: `examples/error-handling-examples.js`
- **Production Setup**: `examples/production-monitoring.js`
- **Workers Integration**: `examples/workers-examples.js`
- **Interactive Demo**: `index.html` (run with local server)

## Development

### Local Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run error handling tests specifically
npm test tests/unit/error-handling.test.js

# Start local demo server
npx serve . # or python -m http.server
# Open http://localhost:3000/index.html
```

### Project Structure

```
js-qrcode/
├── src/                          # Library source code
│   ├── index.js                  # Main API
│   ├── errors.js                 # Error handling system
│   ├── error-router.js           # Error classification and routing
│   ├── generator.js              # QR code generation
│   └── renderers/                # Output format renderers
├── examples/                     # Usage examples
│   └── error-handling-examples.js
├── tests/                        # Test suite
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── dist/                         # Built files
├── index.html                    # Interactive demo
└── README.md                     # This file
```

### Testing Error Handling

```bash
# Run comprehensive error handling test
node examples/error-handling-examples.js

# Test basic functionality
node test-error-handling.js

# Run specific test suites
npm test -- --testNamePattern="Error"
```

## Migration Guide

### From v1.x to v2.x (Error Handling Update)

The core API remains backwards compatible. New features are additive:

```javascript
// v1.x code continues to work unchanged
const svg = QRCode.generate('Hello World');

// v2.x adds new capabilities
const svgWithAnalytics = await QRCode.generateWithAnalytics('Hello World');

// New error handling features
QRCode.onError('DATA_TOO_LONG', handler);
const stats = QRCode.getErrorStats();
```

### Performance Considerations

- **Basic methods** (`generate`): Minimal overhead, same performance as v1.x
- **Analytics methods** (`generateWithAnalytics`): Small overhead for context building and error tracking
- **Error handlers**: Only executed when errors occur
- **Memory usage**: Error history limited to 1000 entries with automatic cleanup

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Bug Reports**: Use GitHub Issues with detailed reproduction steps
2. **Feature Requests**: Discuss in Issues before implementing
3. **Pull Requests**: Include tests and documentation updates
4. **Error Handling**: New error types and codes should follow existing patterns

### Development Setup

```bash
git clone https://github.com/elchika-inc/workers-qrcode.git
cd js-qrcode
npm install
npm run build
npm test
```

## License

MIT License - See [LICENSE](./LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/elchika-inc/workers-qrcode)
- [npm Package](https://www.npmjs.com/package/@elchika-inc/js-qrcode)
- [Bug Reports](https://github.com/elchika-inc/workers-qrcode/issues)
- [Examples](./examples/)
- [Interactive Demo](./index.html)

## Changelog

### v2.0.0 - Advanced Error Handling
- ✨ Added structured error handling with context information
- 📊 Added error analytics and tracking capabilities  
- 🎯 Added error classification and intelligent routing
- 🔧 Added custom error handlers and middleware support
- 📈 Added error statistics and monitoring features
- 🔄 Added automatic error recovery suggestions
- ⚡ Maintained full backwards compatibility
- 🧪 Added comprehensive test coverage for error handling

### v1.x - Core Functionality
- Initial QR code generation
- Workers environment optimization
- SVG output format
- Basic error handling