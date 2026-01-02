// Analyze which slider positions fail to save

const positions = [
    { index: 3, name: '-2', values: [79, 47, 143, 96, 202, 155], saves: true },
    { index: 5, name: '0', values: [85, 40, 149, 83, 206, 140], saves: false },
    { index: 6, name: '+1', values: [88, 36, 152, 76, 208, 132], saves: true },
    { index: 7, name: '+2', values: [91, 33, 155, 70, 210, 125], saves: true },
    { index: 8, name: '+3', values: [94, 29, 158, 63, 212, 117], saves: false },
];

console.log("=== ANALYZING SAVE PATTERN ===\n");

// Check for patterns in the values
console.log("Values analysis:");
for (const pos of positions) {
    console.log(`${pos.name} (index ${pos.index}): [${pos.values.join(', ')}] - ${pos.saves ? 'SAVES' : 'FAILS'}`);
}

console.log("\n--- Looking for patterns ---");

// Check each byte position
for (let bytePos = 0; bytePos < 6; bytePos++) {
    console.log(`\nByte ${bytePos}:`);
    const failing = positions.filter(p => !p.saves).map(p => p.values[bytePos]);
    const saving = positions.filter(p => p.saves).map(p => p.values[bytePos]);
    console.log(`  Failing values: [${failing.join(', ')}]`);
    console.log(`  Saving values: [${saving.join(', ')}]`);
}

// Check for divisibility patterns
console.log("\n--- Checking modulo patterns ---");
for (const pos of positions) {
    const mod5 = pos.values.map(v => v % 5);
    const mod10 = pos.values.map(v => v % 10);
    console.log(`${pos.name}: mod5=[${mod5.join(',')}], mod10=[${mod10.join(',')}] - ${pos.saves ? 'SAVES' : 'FAILS'}`);
}

// Check sum of values
console.log("\n--- Sum of values ---");
for (const pos of positions) {
    const sum = pos.values.reduce((a, b) => a + b, 0);
    console.log(`${pos.name}: sum=${sum} - ${pos.saves ? 'SAVES' : 'FAILS'}`);
}
