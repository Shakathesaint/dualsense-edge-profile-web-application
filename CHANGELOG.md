# 🚀 Changelog v1.1.0

## ✨ New Features

- **🔧 Sensitivity Curve Save Fix** (`v1.1.0`)
  - Fixed a critical bug where certain slider combinations (e.g., both sticks at neutral `0`, or `Left +3` / `Right 0`) would not persist after saving to the controller.
  - Resolved a regression where neutral slider values (`0`) would revert to `+5` after reloading the profile.
  - Implemented correct preservation of "unknown bytes" (magic numbers) from the original profile to ensure data integrity.
  - Fixed CRC32 calculation padding issue that caused potential buffer corruption.

## 🐛 Bug Fixes

- **🎯 Slider Value Logic**
  - Removed deadzone interpolation during profile reading to ensuring raw curve values match preset definitions exactly.
  - Fixed `getCurrentCurveIndex` logic to correctly identify slider positions from raw controller data.

- **💾 Data Integrity**
  - Added `unknownBytes` field to `Profile` model to prevent overwriting critical controller configuration bytes.
  - Removed hardcoded byte overrides in `profileToBytes.ts` that were causing save failures.

## 📝 Documentation

- Added `docs/sensitivity-curve-fix.md` with detailed technical analysis of the save bug and its resolution.
- Updated `README.md` to include the new fix in the features list.
