# Sensitivity Curve Save Fix

## Problem
Certain slider value combinations for sensitivity curves would not save correctly to the DualSense Edge controller. Specifically:
- **[Left 0 (neutral), Right 0 (neutral)]** - did not persist after page reload
- **[Left +3, Right 0]** - did not persist
- Other combinations worked normally

The official PlayStation app could save all combinations without issues.

## Analysis

### Observed Symptoms
1. Logs showed bytes were being sent correctly to the controller
2. "Profile saved" message appeared without errors
3. After page reload, values reverted to previous state
4. Failure pattern seemed random but was reproducible

### Investigation
Comparing hex buffers sent by our app vs those read from the official PlayStation app:

| Buffer | Bytes 34-37 | Bytes 38-39 | Bytes 56-59 | Bytes 60-63 |
|--------|-------------|-------------|-------------|-------------|
| **Official (read)** | `D1 29 83 7E` | `9B 01` | `E7 A7 6C E8` (CRC) | `00 00 00 00` |
| **Our app (write)** | `1C 55 BB 05` | `87 01` | `03 1B 15 74` | `64 A5 E3 11` |

### Root Cause
In `bytesToProfile.ts`, line 320, there was hardcoded data:

```typescript
// DateTime area?
buffers[2].set([0x1c, 0x55, 0xbb, 0x05, 0x87, 0x01], 34);
buffers[2].set(arrayCRC32Le(buffers), 56);
```

**Issue 1**: Bytes 34-39 were hardcoded instead of being preserved from the original profile. This overwrote the "magic bytes" required for certain controller operations.

**Issue 2** (secondary, fixed during investigation): The `arrayCRC32LeBLE` function did not pad the CRC to 8 hex characters, causing variable-length arrays when the CRC started with `0`.

**Issue 3** (Regression): After fixing the above, a new issue appeared where slider 0 values reverted to +5. This was caused by `bytesToProfile` modifying raw curve values by applying deadzone interpolation during read. This caused `getCurrentCurveIndex` to fail matching the modified values against standard preset curves, defaulting to index 10 (+5).

## Solution

### Fix 1: Preserve "unknown" bytes from profile
Added `unknownBytes` field to the `Profile` model:
- Reading: `Array.from(bytesArray[2].slice(34, 38))` in `bytesArrayToProfile`
- Writing: `buffers[2].set(unknownBytes, 34)` in `profileToBytes`

### Fix 2: Correct Buffer 2 structure
```typescript
// Bytes 34-37: unknownBytes (from original profile)
const unknownBytes = profile.getUnknownBytes();
buffers[2].set(unknownBytes, 34);

// Bytes 56-59: Combined CRC of all buffers
buffers[2].set(arrayCRC32Le(buffers), 56);

// Bytes 60-63: Per-buffer CRC (added in App.vue)
```

### Fix 3: CRC padding
```typescript
// Before (bug):
return (CRC32.buf(copy) >>> 0).toString(16).match(/.{1,2}/g)...

// After (fix):
const hexString = crc.toString(16).padStart(8, '0');
return hexString.match(/.{1,2}/g)...
```

### Fix 4: Removed Deadzone Interpolation (Regression Fix)
Removed the code block in `bytesToProfile.ts` that applied deadzone calculations to the raw curve values. This ensures:
1. Profile data remains pure and matches exactly what was saved.
2. `getCurrentCurveIndex` correctly identifies the slider position by comparing raw values.
3. Deadzone effects are left to the visualization layer or controller hardware, not modifying the data model.

## Files Modified
- `src/model/Profile.ts` - Added `unknownBytes` field
- `src/helper/bytesToProfile.ts` - Read/write unknownBytes, removed hardcoded bytes, removed deadzone interpolation
- `src/helper/CRC32.ts` - Pad CRC to 8 characters
- `src/helper/converters.ts` - (Debugged and verified loop logic)

## Verification
✅ [Left 0, Right 0] - Saves correctly
✅ [Left +3, Right 0] - Saves correctly  
✅ Slider values persist correctly after reload (Regression Fix confirmed)
✅ Verified in official PlayStation app
