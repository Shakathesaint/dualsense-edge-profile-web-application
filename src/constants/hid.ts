/**
 * HID-related constants for DualSense Edge controller communication
 */

/**
 * Sony Interactive Entertainment vendor ID
 */
export const SONY_VENDOR_ID = 0x054C;

/**
 * DualSense Edge Wireless Controller product ID
 */
export const DUALSENSE_EDGE_PRODUCT_ID = 0x0DF2;

/**
 * HID device filter for DualSense Edge controller
 */
export const DUALSENSE_EDGE_FILTER = {
    vendorId: SONY_VENDOR_ID,
    productId: DUALSENSE_EDGE_PRODUCT_ID,
} as const;

/**
 * Feature report IDs used for controller communication
 */
export const REPORT_ID = {
    /** First profile feature report ID */
    PROFILE_START: 112,        // 0x70
    /** Last profile feature report ID (exclusive) */
    PROFILE_END: 124,          // 0x7C
    /** Report ID for clearing a profile from controller memory */
    CLEAR_PROFILE: 0x68,
    /** Number of feature reports per profile */
    REPORTS_PER_PROFILE: 3,
} as const;

/**
 * Buffer sizes for HID communication
 */
export const BUFFER_SIZE = 64;

/**
 * Common byte values
 */
export const BYTE = {
    MIN: 0x00,
    MAX: 0xFF,
} as const;

/**
 * CRC32 calculation constants
 */
export const CRC32_REPORT_PREFIX = 0xA3;
