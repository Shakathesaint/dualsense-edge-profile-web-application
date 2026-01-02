
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
        name: 'DEFAULT', curves: [
            new JoystickCurve(128),
            new JoystickCurve(128),
            new JoystickCurve(196),
            new JoystickCurve(196),
            new JoystickCurve(225),
            new JoystickCurve(225)
        ]
    },
    {
        name: 'QUICK', curves: [
            new JoystickCurve(38),
            new JoystickCurve(38),
            new JoystickCurve(122, -3),
            new JoystickCurve(139, [6, 5]),
            new JoystickCurve(255),
            new JoystickCurve(255)
        ]
    },
    {
        name: 'PRECISE', curves: [
            new JoystickCurve(70, 3),
            new JoystickCurve(57, [-3, -4]),
            new JoystickCurve(134, 3),
            new JoystickCurve(115, [-6, -7]),
            new JoystickCurve(196, 2),
            new JoystickCurve(177, [-7, -8])
        ]
    },
    {
        name: 'STEADY', curves: [
            new JoystickCurve(62, -1),
            new JoystickCurve(62, -1),
            new JoystickCurve(120, -4),
            new JoystickCurve(129, [0, -1]),
            new JoystickCurve(197, [3, 2]),
            new JoystickCurve(179, [-5, -6])
        ]
    },
    {
        name: 'DIGITAL', curves: [
            new JoystickCurve(38),
            new JoystickCurve(38),
            new JoystickCurve(38),
            new JoystickCurve(75, 18),
            new JoystickCurve(255),
            new JoystickCurve(255)
        ]
    },
    {
        name: 'DYNAMIC', curves: [
            new JoystickCurve(69, [3, 2]),
            new JoystickCurve(57, [-3, -4]),
            new JoystickCurve(183, [-4, -5]),
            new JoystickCurve(198, 3),
            new JoystickCurve(255),
            new JoystickCurve(255)
        ]
    },
];

console.log("Checking for out of bounds values (0-255)...");

for (const profile of PS5_JOYSTICK_CURVE) {
    for (let sliderIndex = 0; sliderIndex <= 10; sliderIndex++) {
        for (let curveIdx = 0; curveIdx < profile.curves.length; curveIdx++) {
            const val = profile.curves[curveIdx].getByIndex(sliderIndex);
            if (val < 0 || val > 255) {
                console.log(`[ALARM] Profile: ${profile.name}, Slider: ${sliderIndex}, CurveIdx: ${curveIdx}, Value: ${val}`);
            }
        }
    }
}
console.log("Check complete.");
