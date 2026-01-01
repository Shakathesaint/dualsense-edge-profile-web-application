/**
 * Profile data structure constants
 */

/**
 * Byte offsets within profile data buffers
 */
export const PROFILE_OFFSET = {
    // Buffer 0 - Profile label start
    LABEL_START_BUFFER_0: 6,
    LABEL_CRC_RESERVE_BUFFER_0: 4, // Last 4 bytes reserved for CRC

    // Buffer 1 - Profile label continuation and joystick data
    LABEL_START_BUFFER_1: 2,
    LABEL_END_BUFFER_1: 27,
    PROFILE_ID_START: 28,
    LEFT_JOYSTICK_MODIFIER: 44,
    LEFT_JOYSTICK_CURVE_START: 47,
    LEFT_JOYSTICK_CURVE_END: 53,
    RIGHT_JOYSTICK_MODIFIER: 53,
    RIGHT_JOYSTICK_CURVE_START: 56,
    RIGHT_JOYSTICK_CURVE_END: 60,

    // Buffer 2 - Joystick curves continuation and triggers
    RIGHT_JOYSTICK_CURVE_CONT_START: 2,
    RIGHT_JOYSTICK_CURVE_CONT_END: 4,
    LEFT_TRIGGER_MIN: 4,
    LEFT_TRIGGER_MAX: 5,
    RIGHT_TRIGGER_MIN: 6,
    RIGHT_TRIGGER_MAX: 7,
    BUTTON_MAPPING_START: 10,
    BUTTON_MAPPING_END: 26,
    LEFT_JOYSTICK_PROFILE_ID: 30,
    RIGHT_JOYSTICK_PROFILE_ID: 32,
    DATETIME_START: 34,
    CRC_START: 56,
} as const;

/**
 * Assignment dictionary mapping byte values to profile button selectors
 */
export const ASSIGNMENT_BYTE_VALUES = {
    UNASSIGNED: 0,
    FN_TRIANGLE: 112,
    FN_SQUARE: 115,
    FN_CROSS: 118,
    FN_CIRCLE: 121,
} as const;

/**
 * Unassigned profile indicator byte value
 */
export const UNASSIGNED_PROFILE_BYTE = 16;

/**
 * Profile validation constants
 */
export const VALIDATION = {
    /** Number of curve values for joystick sensitivity */
    CURVE_VALUES_LENGTH: 6,
    /** Number of buttons in button mapping */
    BUTTON_MAPPING_LENGTH: 16,
    /** Maximum valid joystick profile ID */
    MAX_JOYSTICK_PROFILE_ID: 5,
    /** Minimum valid joystick profile ID */
    MIN_JOYSTICK_PROFILE_ID: 0,
    /** ID array length for profile identification */
    ID_LENGTH: 16,
} as const;

/**
 * Default joystick curve values
 */
export const DEFAULT_CURVE_VALUES = [128, 128, 196, 196, 225, 225] as const;

/**
 * DateTime bytes written during profile save (placeholder values)
 */
export const DATETIME_BYTES = [0x1c, 0x55, 0xbb, 0x05, 0x87, 0x01] as const;
