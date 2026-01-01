/**
 * Error handling utilities for the DualSense Edge Profile Manager
 */

/**
 * Error types for categorizing HID-related errors
 */
export enum HIDErrorType {
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    COMMUNICATION_ERROR = 'COMMUNICATION_ERROR',
    FEATURE_REPORT_FAILED = 'FEATURE_REPORT_FAILED',
    DEVICE_BUSY = 'DEVICE_BUSY',
}

/**
 * Custom error class for WebHID-specific errors
 */
export class HIDError extends Error {
    constructor(
        public type: HIDErrorType,
        message: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'HIDError';
    }
}

/**
 * Get a user-friendly error message for a given HID error type
 */
export function getHIDErrorMessage(type: HIDErrorType): string {
    switch (type) {
        case HIDErrorType.CONNECTION_FAILED:
            return 'Failed to connect to the controller. Please try reconnecting the USB cable.';
        case HIDErrorType.DEVICE_NOT_FOUND:
            return 'Controller not found. Make sure your DualSense Edge is connected via USB.';
        case HIDErrorType.PERMISSION_DENIED:
            return 'Permission denied. Please allow access to the controller when prompted.';
        case HIDErrorType.COMMUNICATION_ERROR:
            return 'Communication error with the controller. Please try disconnecting and reconnecting.';
        case HIDErrorType.FEATURE_REPORT_FAILED:
            return 'Failed to read/write profile data. Please ensure the controller is properly connected.';
        case HIDErrorType.DEVICE_BUSY:
            return 'The controller is busy. Please wait a moment and try again.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

/**
 * Parse an unknown error into an HIDError
 */
export function parseHIDError(error: unknown): HIDError {
    if (error instanceof HIDError) {
        return error;
    }

    if (error instanceof DOMException) {
        if (error.name === 'NotFoundError') {
            return new HIDError(
                HIDErrorType.DEVICE_NOT_FOUND,
                getHIDErrorMessage(HIDErrorType.DEVICE_NOT_FOUND),
                error
            );
        }
        if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
            return new HIDError(
                HIDErrorType.PERMISSION_DENIED,
                getHIDErrorMessage(HIDErrorType.PERMISSION_DENIED),
                error
            );
        }
        if (error.name === 'InvalidStateError') {
            return new HIDError(
                HIDErrorType.DEVICE_BUSY,
                getHIDErrorMessage(HIDErrorType.DEVICE_BUSY),
                error
            );
        }
    }

    if (error instanceof Error) {
        return new HIDError(
            HIDErrorType.COMMUNICATION_ERROR,
            getHIDErrorMessage(HIDErrorType.COMMUNICATION_ERROR),
            error
        );
    }

    return new HIDError(
        HIDErrorType.COMMUNICATION_ERROR,
        getHIDErrorMessage(HIDErrorType.COMMUNICATION_ERROR)
    );
}

/**
 * Log a message only in development mode
 */
export function devLog(...args: unknown[]): void {
    if (import.meta.env.DEV) {
        console.log('[DEV]', ...args);
    }
}

/**
 * Log a warning only in development mode
 */
export function devWarn(...args: unknown[]): void {
    if (import.meta.env.DEV) {
        console.warn('[DEV]', ...args);
    }
}
