# 🚀 Changelog v2.0.0

## 🎨 Major UI Redesign

- **Modern Minimalist Interface** (`v2.0.0`)
  - Complete visual overhaul with elegant, minimalist design
  - All changes are purely visual - no logic modifications
  - Implemented DM Sans typography throughout the application

### Connection Screen
- Added animated SVG gamepad icon with pulse effect
- Enhanced typography with bolder headings (1.5rem)
- Button glow effect on hover with smooth transitions

### Sidebar & Navigation
- Compact header layout with reduced padding
- Connection status badge with animated green dot indicator
- Increased sidebar width from 320px to 400px for better content visibility
- Profile items with gradient hover effect and left accent border

### Tab Navigation (Critical Change)
- Redesigned from pill-style to modern underline-style tabs
- Uppercase labels with refined letter-spacing
- Animated sliding blue indicator on active tab
- Compact, auto-width tabs instead of full-width

### Configurator
- Borderless profile name input with bottom border
- Save button with glow effect and hover animation
- Refined dropdown styling with focus states

### Configuration Panels
- **Info Cards**: Enhanced glass-morphism effect with 12px backdrop blur
- **Button Binding Popup**: 
  - Glass-morphism design matching info cards
  - Increased width to 240px for long button names
  - Centered over controller image
  - Close button with border matching UI design
  - Improved animation with scale transform
- **Note Boxes**: Left accent border for visual hierarchy
- **Sliders**: Gradient track (secondary → card-hover) with glow shadow on thumb
- **Canvas**: Subtle dot pattern background (16px grid)

### Button Assignment View
- Moved paddle buttons to front view
- Removed back view section for cleaner layout
- Optimized popup positioning

---

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
