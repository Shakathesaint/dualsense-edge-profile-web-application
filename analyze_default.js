// Deep analysis of the DEFAULT profile discrepancy

const expectedDefault = [128, 128, 196, 196, 225, 225];
const actualDefault = [163, 147, 212, 205, 233, 229];

console.log("=== DEFAULT PROFILE DISCREPANCY ANALYSIS ===\n");

console.log("Expected (our code):  ", expectedDefault.join(", "));
console.log("Actual (from device): ", actualDefault.join(", "));
console.log("\nDifferences:");

for (let i = 0; i < 6; i++) {
    const diff = actualDefault[i] - expectedDefault[i];
    console.log(`  Point ${i}: ${expectedDefault[i]} → ${actualDefault[i]} (diff: ${diff > 0 ? '+' : ''}${diff})`);
}

console.log("\n=== HYPOTHESIS: Maybe DEFAULT in official app HAS modifiers ===");
console.log("Let's reverse-engineer what the modifier pattern might be:\n");

// If index 5 is neutral, what would be the modifiers to get these values?
// Working backwards from index 0 (where initialValue is used directly)
console.log("If these ARE the base values (index 0), then modifiers would need to produce them from index 5:");

// For a simple linear modifier m: value_at_5 = initial + 5*m
// So: initial = value_at_5 - 5*m
// And: value_at_0 should equal initial

// If the ORIGINAL formula had modifiers, and we're seeing index 5:
// Let's see if there's a pattern

console.log("\n=== ALTERNATIVE HYPOTHESIS ===");
console.log("What if our slider index interpretation is INVERTED?");
console.log("Official app slider 0 = our slider index 10? Let's check...\n");

// Check all profiles at index 10
class JoystickCurve {
    constructor(initialValue, modifier) {
        this.initialValue = initialValue;
        this.modifier = modifier;
    }
    getByIndex(index) {
        if (!this.modifier) return this.initialValue;
        let value = this.initialValue;
        if (Array.isArray(this.modifier)) {
            for (let i = 0; i < index; i++) {
                value += this.modifier[i % this.modifier.length];
            }
        } else {
            value += index * this.modifier;
        }
        return value;
    }
}

const profiles = {
    'STEADY': [
        new JoystickCurve(62, -1),
        new JoystickCurve(62, -1),
        new JoystickCurve(120, -4),
        new JoystickCurve(129, [0, -1]),
        new JoystickCurve(197, [3, 2]),
        new JoystickCurve(179, [-5, -6])
    ]
};

console.log("STEADY profile at various indices:");
for (let idx = 0; idx <= 10; idx++) {
    const values = profiles.STEADY.map(c => c.getByIndex(idx));
    console.log(`Index ${idx}: [${values.join(', ')}]`);
}

console.log("\n=== CONCLUSION ===");
console.log("The actual values [163, 147, 212, 205, 233, 229] don't match any known profile.");
console.log("This strongly suggests our hardcoded profile curves are INCORRECT for DEFAULT.");
console.log("\nPossible root causes:");
console.log("1. The official PS app uses different formulas than we have hardcoded");
console.log("2. There's a different mapping between Profile IDs and curve types");
console.log("3. The DEFAULT profile in official app actually HAS slider modifiers (unlike our static version)");
