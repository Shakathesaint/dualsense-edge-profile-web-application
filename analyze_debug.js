// Analysis script for the debug data received from user's "Test curve" profile

class JoystickCurve {
    constructor(initialValue, modifier) {
        this.initialValue = initialValue;
        this.modifier = modifier;
    }

    getByIndex(index) {
        if (!this.modifier) {
            return this.initialValue;
        }

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

// Copied from bytesToProfile.ts
const PS5_JOYSTICK_CURVE = [
    {
        name: 'DEFAULT', modifier: 0x03, curves: [
            new JoystickCurve(128),
            new JoystickCurve(128),
            new JoystickCurve(196),
            new JoystickCurve(196),
            new JoystickCurve(225),
            new JoystickCurve(225)
        ]
    },
    {
        name: 'QUICK', modifier: 0x03, curves: [
            new JoystickCurve(38),
            new JoystickCurve(38),
            new JoystickCurve(122, -3),
            new JoystickCurve(139, [6, 5]),
            new JoystickCurve(255),
            new JoystickCurve(255)
        ]
    },
    {
        name: 'PRECISE', modifier: 0x04, curves: [
            new JoystickCurve(70, 3),
            new JoystickCurve(57, [-3, -4]),
            new JoystickCurve(134, 3),
            new JoystickCurve(115, [-6, -7]),
            new JoystickCurve(196, 2),
            new JoystickCurve(177, [-7, -8])
        ]
    },
    {
        name: 'STEADY', modifier: 0x04, curves: [
            new JoystickCurve(62, -1),
            new JoystickCurve(62, -1),
            new JoystickCurve(120, -4),
            new JoystickCurve(129, [0, -1]),
            new JoystickCurve(197, [3, 2]),
            new JoystickCurve(179, [-5, -6])
        ]
    },
    {
        name: 'DIGITAL', modifier: 0x03, curves: [
            new JoystickCurve(38),
            new JoystickCurve(38),
            new JoystickCurve(38),
            new JoystickCurve(75, 18),
            new JoystickCurve(255),
            new JoystickCurve(255)
        ]
    },
    {
        name: 'DYNAMIC', modifier: 0x03, curves: [
            new JoystickCurve(69, [3, 2]),
            new JoystickCurve(57, [-3, -4]),
            new JoystickCurve(183, [-4, -5]),
            new JoystickCurve(198, 3),
            new JoystickCurve(255),
            new JoystickCurve(255)
        ]
    },
];

// User's debug data
const leftCurveValues = [163, 147, 212, 205, 233, 229];
const rightCurveValues = [85, 40, 149, 83, 206, 140]; // from buffer1[56-59] + buffer2[2-3]
const leftModifier = 3;  // buffer1[44]
const rightModifier = 4; // buffer1[53]
const leftProfileIdFromCode = 0;  // buffer2[30]
const rightProfileIdFromCode = 2; // buffer2[32]

console.log("=== ANALYSIS OF 'Test curve' PROFILE ===\n");

// Check Right Stick (seems simpler)
console.log("--- RIGHT STICK ANALYSIS ---");
console.log(`Modifier from buffer1[53]: ${rightModifier} (0x0${rightModifier})`);
console.log(`ProfileId from buffer2[32]: ${rightProfileIdFromCode} (${PS5_JOYSTICK_CURVE[rightProfileIdFromCode].name})`);
console.log(`Curve values: [${rightCurveValues.join(', ')}]`);

// Try to match with PRECISE (ProfileId=2)
const preciseProfile = PS5_JOYSTICK_CURVE[2]; // PRECISE
console.log(`\nTrying to match with ${preciseProfile.name} profile:`);
for (let sliderIdx = 0; sliderIdx <= 10; sliderIdx++) {
    const calculated = preciseProfile.curves.map(c => c.getByIndex(sliderIdx));
    const matches = calculated.every((val, i) => val === rightCurveValues[i]);
    if (matches) {
        console.log(`  ✅ MATCH at slider index ${sliderIdx}! (represents slider position ${sliderIdx - 5})`);
    }
}

// Check Left Stick
console.log("\n--- LEFT STICK ANALYSIS ---");
console.log(`Modifier from buffer1[44]: ${leftModifier} (0x0${leftModifier})`);
console.log(`ProfileId from buffer2[30]: ${leftProfileIdFromCode} (${PS5_JOYSTICK_CURVE[leftProfileIdFromCode].name})`);
console.log(`Curve values: [${leftCurveValues.join(', ')}]`);

// The left stick has modifier 0x03 but ProfileId 0 (DEFAULT)
// DEFAULT values are static [128, 128, 196, 196, 225, 225] - doesn't match!
console.log(`\nDEFAULT profile values: [128, 128, 196, 196, 225, 225]`);
console.log(`Actual values: [${leftCurveValues.join(', ')}]`);
console.log(`Match: ${leftCurveValues.toString() === [128, 128, 196, 196, 225, 225].toString() ? 'YES' : 'NO'}`);

// Try ALL profiles to find a match
console.log("\nSearching ALL profiles for a match:");
for (const profile of PS5_JOYSTICK_CURVE) {
    for (let sliderIdx = 0; sliderIdx <= 10; sliderIdx++) {
        const calculated = profile.curves.map(c => c.getByIndex(sliderIdx));
        const matches = calculated.every((val, i) => val === leftCurveValues[i]);
        if (matches) {
            console.log(`  ✅ MATCH: ${profile.name} at slider index ${sliderIdx}`);
        }
    }
}

console.log("\n=== KEY FINDINGS ===");
console.log("1. buffer1[60-61] = [0, 0] - Empty!");
console.log("2. buffer2[2-3] = [206, 140] - Contains the actual curve data");
console.log("3. Current code reads from buffer2[2-3] which appears CORRECT");
console.log("4. The discrepancy might be in HOW the ProfileId/modifier bytes are used");
