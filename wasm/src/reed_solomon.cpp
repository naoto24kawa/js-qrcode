#include <vector>
#include <stdexcept>
#include <emscripten/bind.h>

class GaloisField {
private:
    static constexpr int SIZE = 256;
    static constexpr int PRIMITIVE = 0x11d; // x^8 + x^4 + x^3 + x^2 + 1
    
    int logTable[SIZE];
    int expTable[SIZE];
    
    void initTables() {
        int x = 1;
        for (int i = 0; i < SIZE - 1; i++) {
            expTable[i] = x;
            logTable[x] = i;
            x <<= 1;
            if (x & SIZE) {
                x ^= PRIMITIVE;
            }
        }
        expTable[SIZE - 1] = 1;
        logTable[0] = 0; // undefined, but we'll use 0
    }

public:
    GaloisField() {
        initTables();
    }
    
    int multiply(int a, int b) const {
        if (a == 0 || b == 0) return 0;
        return expTable[(logTable[a] + logTable[b]) % (SIZE - 1)];
    }
    
    int divide(int a, int b) const {
        if (a == 0) return 0;
        if (b == 0) throw std::runtime_error("Division by zero");
        return expTable[(logTable[a] - logTable[b] + (SIZE - 1)) % (SIZE - 1)];
    }
    
    int power(int base, int exp) const {
        if (base == 0) return 0;
        if (exp == 0) return 1;
        return expTable[(logTable[base] * exp) % (SIZE - 1)];
    }
};

class ReedSolomonEncoder {
private:
    GaloisField gf;
    
    std::vector<int> generatePolynomial(int numEccWords) const {
        std::vector<int> generator = {1}; // Start with polynomial: 1
        
        for (int i = 0; i < numEccWords; i++) {
            // Multiply by (x - α^i)
            std::vector<int> factor = {1, gf.power(2, i)}; // (x - α^i)
            generator = multiplyPolynomials(generator, factor);
        }
        
        return generator;
    }
    
    std::vector<int> multiplyPolynomials(const std::vector<int>& a, const std::vector<int>& b) const {
        std::vector<int> result(a.size() + b.size() - 1, 0);
        
        for (size_t i = 0; i < a.size(); i++) {
            for (size_t j = 0; j < b.size(); j++) {
                result[i + j] ^= gf.multiply(a[i], b[j]);
            }
        }
        
        return result;
    }
    
    std::vector<int> dividePolynomials(const std::vector<int>& dividend, 
                                     const std::vector<int>& divisor) const {
        std::vector<int> remainder = dividend;
        
        for (size_t i = 0; i <= remainder.size() - divisor.size(); i++) {
            if (remainder[i] != 0) {
                int coeff = remainder[i];
                for (size_t j = 0; j < divisor.size(); j++) {
                    remainder[i + j] ^= gf.multiply(divisor[j], coeff);
                }
            }
        }
        
        // Return only the remainder part
        std::vector<int> result(divisor.size() - 1);
        for (size_t i = 0; i < result.size(); i++) {
            result[i] = remainder[remainder.size() - result.size() + i];
        }
        
        return result;
    }

public:
    std::vector<int> encode(const std::vector<int>& dataBytes, int numEccWords) const {
        // Generate the generator polynomial
        std::vector<int> generator = generatePolynomial(numEccWords);
        
        // Prepare dividend: data bytes followed by zeros
        std::vector<int> dividend(dataBytes.size() + numEccWords, 0);
        std::copy(dataBytes.begin(), dataBytes.end(), dividend.begin());
        
        // Perform polynomial division
        std::vector<int> remainder = dividePolynomials(dividend, generator);
        
        // Combine data and error correction bytes
        std::vector<int> result(dataBytes.size() + numEccWords);
        std::copy(dataBytes.begin(), dataBytes.end(), result.begin());
        std::copy(remainder.begin(), remainder.end(), result.begin() + dataBytes.size());
        
        return result;
    }
};

// Error correction parameters for different QR versions and levels
struct ECCParams {
    int totalCodewords;
    int eccPerBlock;
    int numBlocks;
    int dataPerBlock;
};

class QRErrorCorrection {
private:
    ReedSolomonEncoder encoder;
    
    // Error correction parameters table [version][level]
    // Simplified version for key QR code versions
    static const ECCParams ECC_TABLE[16][4]; // [version 1-15][L,M,Q,H]

public:
    std::vector<int> addErrorCorrection(const std::vector<int>& dataBytes, 
                                      int version, 
                                      const std::string& errorCorrectionLevel) const {
        if (version < 1 || version > 15) {
            throw std::runtime_error("Unsupported QR version");
        }
        
        int levelIndex = 0;
        if (errorCorrectionLevel == "M") levelIndex = 1;
        else if (errorCorrectionLevel == "Q") levelIndex = 2;
        else if (errorCorrectionLevel == "H") levelIndex = 3;
        
        const ECCParams& params = ECC_TABLE[version - 1][levelIndex];
        
        // For simplicity, we're implementing single block encoding
        // Production version would handle multiple blocks
        return encoder.encode(dataBytes, params.eccPerBlock);
    }
};

// Error correction parameters table (simplified)
const ECCParams QRErrorCorrection::ECC_TABLE[16][4] = {
    // Version 1
    {{26, 7, 1, 19}, {26, 10, 1, 16}, {26, 13, 1, 13}, {26, 17, 1, 9}},
    // Version 2
    {{44, 10, 1, 34}, {44, 16, 1, 28}, {44, 22, 1, 22}, {44, 28, 1, 16}},
    // Version 3
    {{70, 15, 1, 55}, {70, 26, 1, 44}, {70, 36, 2, 17}, {70, 44, 2, 13}},
    // Version 4
    {{100, 20, 1, 80}, {100, 36, 2, 32}, {100, 52, 2, 24}, {100, 64, 4, 9}},
    // Version 5
    {{134, 26, 1, 108}, {134, 48, 2, 43}, {134, 72, 2, 15}, {134, 88, 2, 11}},
    // Versions 6-15 (simplified parameters)
    {{172, 36, 2, 68}, {172, 64, 4, 27}, {172, 96, 4, 19}, {172, 112, 4, 15}},
    {{196, 40, 2, 78}, {196, 72, 4, 31}, {196, 108, 2, 14}, {196, 130, 5, 13}},
    {{242, 48, 2, 97}, {242, 88, 2, 38}, {242, 132, 4, 18}, {242, 156, 6, 14}},
    {{292, 60, 2, 116}, {292, 110, 3, 36}, {292, 160, 4, 16}, {292, 192, 6, 16}},
    {{346, 72, 2, 137}, {346, 130, 4, 43}, {346, 192, 6, 19}, {346, 224, 7, 19}},
    {{404, 80, 4, 81}, {404, 150, 1, 50}, {404, 224, 4, 22}, {404, 264, 4, 22}},
    {{466, 96, 2, 92}, {466, 176, 6, 36}, {466, 260, 4, 24}, {466, 308, 5, 24}},
    {{532, 104, 4, 107}, {532, 198, 8, 37}, {532, 288, 8, 24}, {532, 352, 11, 24}},
    {{581, 120, 3, 115}, {581, 216, 4, 40}, {581, 320, 11, 24}, {581, 384, 5, 24}},
    {{655, 132, 5, 87}, {655, 240, 5, 41}, {655, 360, 5, 24}, {655, 432, 5, 24}}
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(reed_solomon) {
    emscripten::register_vector<int>("VectorInt");
    
    emscripten::class_<QRErrorCorrection>("QRErrorCorrection")
        .constructor()
        .function("addErrorCorrection", &QRErrorCorrection::addErrorCorrection);
}