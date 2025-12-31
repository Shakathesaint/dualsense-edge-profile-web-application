/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

// WebHID API type declarations
// https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API
interface HIDDevice {
    opened: boolean;
    vendorId: number;
    productId: number;
    productName: string;
    collections: HIDCollectionInfo[];
    open(): Promise<void>;
    close(): Promise<void>;
    sendReport(reportId: number, data: BufferSource): Promise<void>;
    sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
    receiveFeatureReport(reportId: number): Promise<DataView>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface HIDCollectionInfo {
    usagePage: number;
    usage: number;
    type: number;
    children: HIDCollectionInfo[];
    inputReports: HIDReportInfo[];
    outputReports: HIDReportInfo[];
    featureReports: HIDReportInfo[];
}

interface HIDReportInfo {
    reportId: number;
    items: HIDReportItem[];
}

interface HIDReportItem {
    isAbsolute: boolean;
    isArray: boolean;
    isRange: boolean;
    hasNull: boolean;
    usages: number[];
    usageMinimum: number;
    usageMaximum: number;
    reportSize: number;
    reportCount: number;
    unitExponent: number;
    unit: string;
    logicalMinimum: number;
    logicalMaximum: number;
    physicalMinimum: number;
    physicalMaximum: number;
    strings: string[];
}

interface HIDDeviceFilter {
    vendorId?: number;
    productId?: number;
    usagePage?: number;
    usage?: number;
}

interface HIDDeviceRequestOptions {
    filters: HIDDeviceFilter[];
}

interface HID extends EventTarget {
    getDevices(): Promise<HIDDevice[]>;
    requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
    addEventListener(type: 'connect' | 'disconnect', listener: (event: HIDConnectionEvent) => void): void;
    removeEventListener(type: 'connect' | 'disconnect', listener: (event: HIDConnectionEvent) => void): void;
}

interface HIDConnectionEvent extends Event {
    device: HIDDevice;
}

interface Navigator {
    hid?: HID;
}
