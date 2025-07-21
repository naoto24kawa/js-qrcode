#!/bin/bash

# WASM Build Script for Workers Environment
# Optimized for minimal bundle size and Workers compatibility

set -e

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

# Function to build a specific module
build_module() {
    local module_name=$1
    local cpp_file=$2
    local output_file=$3
    local export_name=$4
    
    echo "Building $module_name WASM module..."
    
    emcc $cpp_file \
      -o $output_file \
      -s WASM=1 \
      -s MODULARIZE=1 \
      -s EXPORT_NAME="'$export_name'" \
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
    
    echo "$module_name WASM module built successfully!"
    echo "Output: $output_file"
}

# Parse command line arguments
if [ "$1" = "reed_solomon" ]; then
    build_module "Reed-Solomon" "src/reed_solomon.cpp" "../src/wasm/reed_solomon.js" "ReedSolomonModule"
elif [ "$1" = "masking" ]; then
    build_module "Masking" "src/masking.cpp" "../src/wasm/masking.js" "MaskingModule"
elif [ "$1" = "data_encoder" ]; then
    build_module "Data Encoder" "src/data_encoder.cpp" "../src/wasm/data_encoder.js" "DataEncoderModule"
else
    # Build all modules
    echo "Building all WASM modules..."
    build_module "Reed-Solomon" "src/reed_solomon.cpp" "../src/wasm/reed_solomon.js" "ReedSolomonModule"
    build_module "Masking" "src/masking.cpp" "../src/wasm/masking.js" "MaskingModule"
    build_module "Data Encoder" "src/data_encoder.cpp" "../src/wasm/data_encoder.js" "DataEncoderModule"
    
    echo ""
    echo "All WASM modules built successfully!"
    if [ -f ../src/wasm/reed_solomon.js ]; then
        echo "Reed-Solomon: $(du -h ../src/wasm/reed_solomon.js | cut -f1)"
    fi
    if [ -f ../src/wasm/masking.js ]; then
        echo "Masking: $(du -h ../src/wasm/masking.js | cut -f1)"
    fi
    if [ -f ../src/wasm/data_encoder.js ]; then
        echo "Data Encoder: $(du -h ../src/wasm/data_encoder.js | cut -f1)"
    fi
fi

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

cat > ../src/wasm/masking.d.ts << 'EOF'
declare module 'masking-wasm' {
  export interface QRMaskingWASM {
    applyMask(modules: boolean[][], maskPattern: number, size: number): boolean[][];
    evaluateMask(modules: boolean[][], size: number): number;
    findBestMask(modules: boolean[][], size: number): number;
    getPenaltyBreakdown(modules: boolean[][], size: number): number[];
    evaluateRule1(modules: boolean[][], size: number): number;
    evaluateRule2(modules: boolean[][], size: number): number;
    evaluateRule3(modules: boolean[][], size: number): number;
    evaluateRule4(modules: boolean[][], size: number): number;
  }

  export interface MaskingModule {
    QRMaskingWASM: {
      new(): QRMaskingWASM;
    };
  }

  export default function createModule(): Promise<MaskingModule>;
}
EOF

cat > ../src/wasm/data_encoder.d.ts << 'EOF'
declare module 'data-encoder-wasm' {
  export interface QRDataEncoderWASM {
    detectMode(data: string): number;
    determineVersion(data: string, mode: number, errorCorrectionLevel: string): number;
    encode(data: string, mode: number, version: number): string;
    encodeToBytes(data: string, mode: number, version: number, errorCorrectionLevel: string): number[];
    getModeIndex(mode: number): number;
    isAlphanumeric(data: string): boolean;
    getUtf8Bytes(data: string): number[];
  }

  export interface DataEncoderModule {
    QRDataEncoderWASM: {
      new(): QRDataEncoderWASM;
    };
    QR_MODE_NUMERIC: number;
    QR_MODE_ALPHANUMERIC: number;
    QR_MODE_BYTE: number;
  }

  export default function createModule(): Promise<DataEncoderModule>;
}
EOF

echo "TypeScript definitions created:"
echo "  - src/wasm/reed_solomon.d.ts"
echo "  - src/wasm/masking.d.ts"
echo "  - src/wasm/data_encoder.d.ts"