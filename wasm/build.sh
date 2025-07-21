#!/bin/bash

# Reed-Solomon WASM Build Script for Workers Environment
# Optimized for minimal bundle size and Workers compatibility

set -e

echo "Building Reed-Solomon WASM module..."

# Check if emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten not found. Please install Emscripten SDK:"
    echo "git clone https://github.com/emscripten-core/emsdk.git"
    echo "cd emsdk && ./emsdk install latest && ./emsdk activate latest"
    echo "source ./emsdk_env.sh"
    exit 1
fi

# Create output directory
mkdir -p ../src/wasm

# Compile with optimizations for Workers environment
emcc src/reed_solomon.cpp \
  -o ../src/wasm/reed_solomon.js \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="'ReedSolomonModule'" \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=1MB \
  -s MAXIMUM_MEMORY=4MB \
  -s NO_FILESYSTEM=1 \
  -s NO_EXIT_RUNTIME=1 \
  -s ENVIRONMENT='web,worker' \
  -s SINGLE_FILE=1 \
  -O3 \
  -flto \
  --bind \
  --closure 1 \
  -s ASSERTIONS=0 \
  -s STACK_SIZE=64KB

echo "WASM module built successfully!"
echo "Output: src/wasm/reed_solomon.js"
echo "Size: $(du -h ../src/wasm/reed_solomon.js | cut -f1)"

# Create type definitions for TypeScript compatibility
cat > ../src/wasm/reed_solomon.d.ts << 'EOF'
declare module 'reed-solomon-wasm' {
  export interface QRErrorCorrection {
    addErrorCorrection(dataBytes: number[], version: number, errorCorrectionLevel: string): number[];
  }

  export interface ReedSolomonModule {
    QRErrorCorrection: {
      new(): QRErrorCorrection;
    };
  }

  export default function createModule(): Promise<ReedSolomonModule>;
}
EOF

echo "TypeScript definitions created: src/wasm/reed_solomon.d.ts"