// Analyze byte patterns for failing vs working cases

// PRECISE curve values by index
const PRECISE_VALUES = {
    0: [70, 57, 134, 115, 196, 177],  // -5
    3: [79, 47, 143, 96, 202, 155],   // -2
    5: [85, 40, 149, 83, 206, 140],   // 0 (neutral)
    8: [94, 29, 158, 63, 212, 117],   // +3
    10: [100, 22, 164, 50, 216, 102], // +5
};

// Cases based on user testing
// [Left 0, Right 0] -> FAILS
// [Left +3, Right 0] -> FAILS
// [Left +5, Right 0] -> WORKS
// [Left 0, Right +2] -> WORKS

console.log("=== FAILING CASES ===");
console.log("[Left 0, Right 0]:", PRECISE_VALUES[5], PRECISE_VALUES[5]);
console.log("[Left +3, Right 0]:", PRECISE_VALUES[8], PRECISE_VALUES[5]);

console.log("\n=== WORKING CASES ===");
console.log("[Left +5, Right 0]:", PRECISE_VALUES[10], PRECISE_VALUES[5]);

// Look for patterns
console.log("\n=== BYTE ANALYSIS ===");

// Buffer 1 structure (bytes 47-52: Left, 56-59: Right part 1)
// Buffer 2 structure (bytes 2-3: Right part 2)

function analyzeCase(leftIdx, rightIdx, works) {
    const left = PRECISE_VALUES[leftIdx];
    const right = PRECISE_VALUES[rightIdx];

    // Buffer 1 bytes 47-52: Left curve (6 bytes)
    // Buffer 1 bytes 56-59: Right curve first 4 bytes
    // Buffer 2 bytes 2-3: Right curve last 2 bytes

    const buf1_47_52 = left;  // Left curve
    const buf1_56_59 = right.slice(0, 4);  // Right first 4
    const buf2_2_3 = right.slice(4, 6);  // Right last 2

    console.log(`\n[Left ${leftIdx}, Right ${rightIdx}] - ${works ? 'WORKS' : 'FAILS'}`);
    console.log(`  Buffer 1 [47-52]: [${buf1_47_52.join(', ')}]`);
    console.log(`  Buffer 1 [56-59]: [${buf1_56_59.join(', ')}]`);
    console.log(`  Buffer 2 [2-3]: [${buf2_2_3.join(', ')}]`);

    // Check for overlapping bytes between left and right in buffer 1
    // Left ends at 52, Right starts at 56... no overlap there

    // Check sum/checksum patterns
    const leftSum = left.reduce((a, b) => a + b, 0);
    const rightSum = right.reduce((a, b) => a + b, 0);
    console.log(`  Left sum: ${leftSum}, Right sum: ${rightSum}`);

    // XOR pattern
    const xorAll = [...left, ...right].reduce((a, b) => a ^ b, 0);
    console.log(`  XOR all values: ${xorAll}`);

    return { leftSum, rightSum, xorAll };
}

const fail1 = analyzeCase(5, 5, false);
const fail2 = analyzeCase(8, 5, false);
const work1 = analyzeCase(10, 5, true);

console.log("\n=== PATTERN COMPARISON ===");
console.log("Failing cases XOR:", fail1.xorAll, fail2.xorAll);
console.log("Working cases XOR:", work1.xorAll);

// What's special about index 5 and 8?
// Index 5 values: [85, 40, 149, 83, 206, 140]
// Index 8 values: [94, 29, 158, 63, 212, 117]

console.log("\n=== CHECKING NEUTRAL (Index 5) SPECIFICS ===");
const neutral = PRECISE_VALUES[5];
console.log("Neutral values in hex:", neutral.map(v => '0x' + v.toString(16).padStart(2, '0').toUpperCase()));

// Check if any byte combinations create magic numbers
console.log("\n=== CHECKING FOR MAGIC BYTE SEQUENCES ===");
// When both Left and Right are neutral, buffer 1 bytes 47-52 and 56-59 might create a pattern
console.log("Left neutral as bytes 47-52:", neutral);
console.log("Right neutral first 4 as bytes 56-59:", neutral.slice(0, 4));
// Could the sequence 47-59 create something special when both are neutral?
