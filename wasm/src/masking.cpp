#include <vector>
#include <cmath>
#include <algorithm>
#include <emscripten/bind.h>

// Mask evaluation penalty constants
const int RULE1_BASE_PENALTY = 3;
const int RULE1_MIN_CONSECUTIVE = 5;
const int RULE2_BLOCK_PENALTY = 3;
const int RULE3_FINDER_PATTERN_PENALTY = 40;
const int RULE3_PATTERN_LENGTH = 7;
const int RULE3_LIGHT_PADDING = 4;
const int RULE4_PENALTY_STEP = 10;
const int RULE4_DEVIATION_STEP = 5;
const int OPTIMAL_DARK_PERCENTAGE = 50;

// Mask pattern functions
class MaskPatterns {
public:
    static bool pattern0(int row, int col) {
        return (row + col) % 2 == 0;
    }
    
    static bool pattern1(int row, int col) {
        return row % 2 == 0;
    }
    
    static bool pattern2(int row, int col) {
        return col % 3 == 0;
    }
    
    static bool pattern3(int row, int col) {
        return (row + col) % 3 == 0;
    }
    
    static bool pattern4(int row, int col) {
        return (row / 2 + col / 3) % 2 == 0;
    }
    
    static bool pattern5(int row, int col) {
        return (row * col) % 2 + (row * col) % 3 == 0;
    }
    
    static bool pattern6(int row, int col) {
        return ((row * col) % 2 + (row * col) % 3) % 2 == 0;
    }
    
    static bool pattern7(int row, int col) {
        return ((row + col) % 2 + (row * col) % 3) % 2 == 0;
    }
    
    static bool (*patterns[8])(int, int);
};

bool (*MaskPatterns::patterns[8])(int, int) = {
    pattern0, pattern1, pattern2, pattern3,
    pattern4, pattern5, pattern6, pattern7
};

class QRMaskingWASM {
private:
    // Check if module position is reserved (finder patterns, timing patterns, etc.)
    bool isReservedModule(int row, int col, int size) const {
        // Simplified reservation check - in production, this would include
        // finder patterns, separators, timing patterns, dark module, etc.
        
        // Finder patterns (top-left, top-right, bottom-left)
        if ((row < 9 && col < 9) ||                           // Top-left
            (row < 9 && col >= size - 8) ||                   // Top-right
            (row >= size - 8 && col < 9)) {                   // Bottom-left
            return true;
        }
        
        // Timing patterns
        if (row == 6 || col == 6) {
            return true;
        }
        
        // Format information areas
        if ((row < 9 && col >= size - 8) ||
            (row >= size - 7 && col < 9)) {
            return true;
        }
        
        return false;
    }

public:
    // Apply mask pattern to modules
    std::vector<std::vector<bool>> applyMask(
        const std::vector<std::vector<bool>>& modules, 
        int maskPattern, 
        int size) const {
        
        std::vector<std::vector<bool>> maskedModules = modules;
        
        for (int row = 0; row < size; row++) {
            for (int col = 0; col < size; col++) {
                if (!isReservedModule(row, col, size)) {
                    if (MaskPatterns::patterns[maskPattern](row, col)) {
                        maskedModules[row][col] = !maskedModules[row][col];
                    }
                }
            }
        }
        
        return maskedModules;
    }
    
    // Rule 1: Adjacent modules in row/column with same color
    int evaluateRule1(const std::vector<std::vector<bool>>& modules, int size) const {
        int penalty = 0;
        
        // Check rows
        for (int row = 0; row < size; row++) {
            int count = 1;
            bool prevModule = modules[row][0];
            
            for (int col = 1; col < size; col++) {
                if (modules[row][col] == prevModule) {
                    count++;
                } else {
                    if (count >= RULE1_MIN_CONSECUTIVE) {
                        penalty += RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
                    }
                    count = 1;
                    prevModule = modules[row][col];
                }
            }
            if (count >= RULE1_MIN_CONSECUTIVE) {
                penalty += RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
            }
        }
        
        // Check columns
        for (int col = 0; col < size; col++) {
            int count = 1;
            bool prevModule = modules[0][col];
            
            for (int row = 1; row < size; row++) {
                if (modules[row][col] == prevModule) {
                    count++;
                } else {
                    if (count >= RULE1_MIN_CONSECUTIVE) {
                        penalty += RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
                    }
                    count = 1;
                    prevModule = modules[row][col];
                }
            }
            if (count >= RULE1_MIN_CONSECUTIVE) {
                penalty += RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
            }
        }
        
        return penalty;
    }
    
    // Rule 2: 2x2 blocks of same color
    int evaluateRule2(const std::vector<std::vector<bool>>& modules, int size) const {
        int penalty = 0;
        
        for (int row = 0; row < size - 1; row++) {
            for (int col = 0; col < size - 1; col++) {
                bool color = modules[row][col];
                if (modules[row][col + 1] == color &&
                    modules[row + 1][col] == color &&
                    modules[row + 1][col + 1] == color) {
                    penalty += RULE2_BLOCK_PENALTY;
                }
            }
        }
        
        return penalty;
    }
    
    // Rule 3: Patterns that look like finder patterns
    int evaluateRule3(const std::vector<std::vector<bool>>& modules, int size) const {
        int penalty = 0;
        
        // Dark-Light-Dark-Dark-Dark-Light-Dark pattern (1011101)
        const std::vector<bool> pattern1 = {true, false, true, true, true, false, true};
        // Light-Dark-Light-Light-Light-Dark-Light pattern (0100010)
        const std::vector<bool> pattern2 = {false, true, false, false, false, true, false};
        
        // Check rows
        for (int row = 0; row < size; row++) {
            for (int col = 0; col <= size - RULE3_PATTERN_LENGTH; col++) {
                bool matchesPattern1 = true;
                bool matchesPattern2 = true;
                
                for (int i = 0; i < RULE3_PATTERN_LENGTH; i++) {
                    if (modules[row][col + i] != pattern1[i]) {
                        matchesPattern1 = false;
                    }
                    if (modules[row][col + i] != pattern2[i]) {
                        matchesPattern2 = false;
                    }
                }
                
                if (matchesPattern1 || matchesPattern2) {
                    // Check for 4 light modules padding on either side
                    bool hasLeftPadding = true;
                    bool hasRightPadding = true;
                    
                    // Check left padding
                    for (int i = std::max(0, col - RULE3_LIGHT_PADDING); i < col; i++) {
                        if (modules[row][i]) {
                            hasLeftPadding = false;
                            break;
                        }
                    }
                    
                    // Check right padding
                    for (int i = col + RULE3_PATTERN_LENGTH; 
                         i < std::min(size, col + RULE3_PATTERN_LENGTH + RULE3_LIGHT_PADDING); 
                         i++) {
                        if (modules[row][i]) {
                            hasRightPadding = false;
                            break;
                        }
                    }
                    
                    if (hasLeftPadding || hasRightPadding) {
                        penalty += RULE3_FINDER_PATTERN_PENALTY;
                    }
                }
            }
        }
        
        // Check columns
        for (int col = 0; col < size; col++) {
            for (int row = 0; row <= size - RULE3_PATTERN_LENGTH; row++) {
                bool matchesPattern1 = true;
                bool matchesPattern2 = true;
                
                for (int i = 0; i < RULE3_PATTERN_LENGTH; i++) {
                    if (modules[row + i][col] != pattern1[i]) {
                        matchesPattern1 = false;
                    }
                    if (modules[row + i][col] != pattern2[i]) {
                        matchesPattern2 = false;
                    }
                }
                
                if (matchesPattern1 || matchesPattern2) {
                    // Check for 4 light modules padding on either side
                    bool hasTopPadding = true;
                    bool hasBottomPadding = true;
                    
                    // Check top padding
                    for (int i = std::max(0, row - RULE3_LIGHT_PADDING); i < row; i++) {
                        if (modules[i][col]) {
                            hasTopPadding = false;
                            break;
                        }
                    }
                    
                    // Check bottom padding
                    for (int i = row + RULE3_PATTERN_LENGTH; 
                         i < std::min(size, row + RULE3_PATTERN_LENGTH + RULE3_LIGHT_PADDING); 
                         i++) {
                        if (modules[i][col]) {
                            hasBottomPadding = false;
                            break;
                        }
                    }
                    
                    if (hasTopPadding || hasBottomPadding) {
                        penalty += RULE3_FINDER_PATTERN_PENALTY;
                    }
                }
            }
        }
        
        return penalty;
    }
    
    // Rule 4: Balance of dark and light modules
    int evaluateRule4(const std::vector<std::vector<bool>>& modules, int size) const {
        int darkCount = 0;
        int totalModules = size * size;
        
        for (int row = 0; row < size; row++) {
            for (int col = 0; col < size; col++) {
                if (modules[row][col]) {
                    darkCount++;
                }
            }
        }
        
        double darkPercentage = (static_cast<double>(darkCount) * 100.0) / totalModules;
        double deviation = std::abs(darkPercentage - OPTIMAL_DARK_PERCENTAGE);
        
        // Penalty increases by 10 for every 5% deviation from 50%
        int penalty = static_cast<int>(deviation / RULE4_DEVIATION_STEP) * RULE4_PENALTY_STEP;
        
        return penalty;
    }
    
    // Evaluate mask quality according to QR Code specification
    int evaluateMask(const std::vector<std::vector<bool>>& modules, int size) const {
        int penalty = 0;
        
        penalty += evaluateRule1(modules, size);
        penalty += evaluateRule2(modules, size);
        penalty += evaluateRule3(modules, size);
        penalty += evaluateRule4(modules, size);
        
        return penalty;
    }
    
    // Find the best mask pattern by evaluating all 8 patterns
    int findBestMask(const std::vector<std::vector<bool>>& modules, int size) const {
        int bestMask = 0;
        int lowestPenalty = INT_MAX;
        
        for (int maskPattern = 0; maskPattern < 8; maskPattern++) {
            std::vector<std::vector<bool>> maskedModules = applyMask(modules, maskPattern, size);
            int penalty = evaluateMask(maskedModules, size);
            
            if (penalty < lowestPenalty) {
                lowestPenalty = penalty;
                bestMask = maskPattern;
            }
        }
        
        return bestMask;
    }
    
    // Get penalty breakdown for analysis
    std::vector<int> getPenaltyBreakdown(const std::vector<std::vector<bool>>& modules, int size) const {
        std::vector<int> penalties(4);
        penalties[0] = evaluateRule1(modules, size);
        penalties[1] = evaluateRule2(modules, size);
        penalties[2] = evaluateRule3(modules, size);
        penalties[3] = evaluateRule4(modules, size);
        return penalties;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(masking) {
    emscripten::register_vector<bool>("VectorBool");
    emscripten::register_vector<std::vector<bool>>("VectorVectorBool");
    emscripten::register_vector<int>("VectorInt");
    
    emscripten::class_<QRMaskingWASM>("QRMaskingWASM")
        .constructor()
        .function("applyMask", &QRMaskingWASM::applyMask)
        .function("evaluateMask", &QRMaskingWASM::evaluateMask)
        .function("findBestMask", &QRMaskingWASM::findBestMask)
        .function("getPenaltyBreakdown", &QRMaskingWASM::getPenaltyBreakdown)
        .function("evaluateRule1", &QRMaskingWASM::evaluateRule1)
        .function("evaluateRule2", &QRMaskingWASM::evaluateRule2)
        .function("evaluateRule3", &QRMaskingWASM::evaluateRule3)
        .function("evaluateRule4", &QRMaskingWASM::evaluateRule4);
}