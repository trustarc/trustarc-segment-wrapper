# TrustArc Segment Wrapper Build Instructions

This document provides instructions for building and testing the TrustArc Segment Wrapper package.

## Prerequisites

- Node.js (version 14 or higher)
- npm (version 6 or higher)
- TypeScript (version 5.6.2 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/trustarc/trustarc-segment-wrapper.git
cd trustarc-segment-wrapper
```

2. Install dependencies:
```bash
npm install
```

## Building

The package can be built in multiple formats:
- CommonJS (CJS)
- ES Modules (ESM)
- Universal Module Definition (UMD)
- Standalone Bundle (for browser use)

### Build All Formats

To build all formats at once:
```bash
npm run build
```

This will run the following commands in sequence:
- `npm run build:cjs` - Builds CommonJS format
- `npm run build:esm` - Builds ES Modules format
- `npm run build:umd` - Builds UMD format
- `npm run build:standalone` - Builds standalone bundle for browser use

### Build Individual Formats

You can also build individual formats:

```bash
# Build CommonJS format
npm run build:cjs

# Build ES Modules format
npm run build:esm

# Build UMD format
npm run build:umd

# Build standalone bundle
npm run build:standalone
```

The built files will be available in the `dist` directory:
- `dist/cjs/` - CommonJS format
- `dist/esm/` - ES Modules format
- `dist/umd/` - Universal Module Definition
- `dist/standalone/` - Standalone bundle for browser use

## Testing

### Run Tests

To run tests in watch mode:
```bash
npm test
```

### Run Tests with Coverage

To run tests with coverage reporting:
```bash
npm run test:coverage
```

This will generate a coverage report in the `coverage` directory.

## Code Quality

### Linting

To run the linter:
```bash
npm run lint
```

### Formatting

To format the code:
```bash
npm run format
```

## Package Structure

The built package includes:

```
dist/
├── cjs/           # CommonJS format
├── esm/           # ES Modules format
├── umd/           # Universal Module Definition
├── standalone/    # Standalone bundle for browser use
└── types/         # TypeScript type definitions
```

## Usage

### Node.js / Module Bundlers

After building, you can import the package in your project:

```typescript
// ES Modules
import { withTrustArc } from '@trustarc/trustarc-segment-wrapper';

// CommonJS
const { withTrustArc } = require('@trustarc/trustarc-segment-wrapper');
```

### Browser

For browser usage, you can include the standalone bundle directly:

```html
<script src="path/to/dist/standalone/trustarc-segment-wrapper-v1.1.1.js"></script>
<script>
  // The wrapper will be available as TrustArcWrapper
  const { withTrustArc } = TrustArcWrapper;
</script>
```

Note: The filename includes the package version (e.g., v1.1.1). When updating the package version in package.json, the output filename will automatically update to match.

## Troubleshooting

If you encounter any issues during the build process:

1. Make sure all dependencies are installed correctly
2. Check that you're using a compatible Node.js version
3. Clear the `dist` directory and node_modules:
   ```bash
   rm -rf dist node_modules
   npm install
   ```
4. Try rebuilding the package

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

## License

This project is licensed under the Apache-2.0 License - see the LICENSE file for details. 