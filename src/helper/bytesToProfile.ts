import Profile from "../model/Profile";
import Joystick from "../model/Joystick";
import { JoystickProfileId } from "../enum/JoystickProfileId";
import JoystickCurve from "../model/JoystickCurve";
import Trigger from "../model/Trigger";
import StickDeadzone from "../model/StickDeadzone";
import { ProfileButtonSelector } from "../enum/ProfileButtonSelector";
import { arrayCRC32Le, arrayCRC32LeBLE } from "./CRC32";
import ButtonMapping from "../model/ButtonMapping";
import { BUFFER_SIZE, CRC32_REPORT_PREFIX, REPORT_ID } from "../constants/hid";

export const PS5_JOYSTICK_CURVE = [
    new Joystick(JoystickProfileId.DEFAULT, [
        new JoystickCurve(128),
        new JoystickCurve(128),
        new JoystickCurve(196),
        new JoystickCurve(196),
        new JoystickCurve(225),
        new JoystickCurve(225)
    ], 0x03),
    new Joystick(JoystickProfileId.QUICK, [
        new JoystickCurve(38),
        new JoystickCurve(38),
        new JoystickCurve(122, -3),
        new JoystickCurve(139, [6, 5]),
        new JoystickCurve(255),
        new JoystickCurve(255)
    ], 0x03),
    new Joystick(JoystickProfileId.PRECISE, [
        new JoystickCurve(70, 3),
        new JoystickCurve(57, [-3, -4]),
        new JoystickCurve(134, 3),
        new JoystickCurve(115, [-6, -7]),
        new JoystickCurve(196, 2),
        new JoystickCurve(177, [-7, -8])
    ], 0x04),
    new Joystick(JoystickProfileId.STEADY, [
        new JoystickCurve(62, -1),
        new JoystickCurve(62, -1),
        new JoystickCurve(120, -4),
        new JoystickCurve(129, [0, -1]),
        new JoystickCurve(197, [3, 2]),
        new JoystickCurve(179, [-5, -6])
    ], 0x04),
    new Joystick(JoystickProfileId.DIGITAL, [
        new JoystickCurve(38),
        new JoystickCurve(38),
        new JoystickCurve(38),
        new JoystickCurve(75, 18),
        new JoystickCurve(255),
        new JoystickCurve(255)
    ], 0x03),
    new Joystick(JoystickProfileId.DYNAMIC, [
        new JoystickCurve(69, [3, 2]),
        new JoystickCurve(57, [-3, -4]),
        new JoystickCurve(183, [-4, -5]),
        new JoystickCurve(198, 3),
        new JoystickCurve(255),
        new JoystickCurve(255)
    ], 0x03),
];

const REPORT_CRC_LENGTH = 4;

const normalizeCrcBytes = (crcBytes: number[]): number[] => {
    const normalized = new Array(REPORT_CRC_LENGTH).fill(0);
    for (let i = 0; i < Math.min(crcBytes.length, REPORT_CRC_LENGTH); i++) {
        normalized[i] = crcBytes[i];
    }
    return normalized;
};

const computeReportCrc = (report: Uint8Array): number[] => {
    const payload = report.slice();
    payload.fill(0, payload.length - REPORT_CRC_LENGTH);
    const crcBytes = arrayCRC32LeBLE(new Uint8Array([CRC32_REPORT_PREFIX, ...payload]));
    return normalizeCrcBytes(crcBytes);
};

export function validateProfileReports(reports: Uint8Array[], profileIndex: number): string | null {
    if (reports.length !== REPORT_ID.REPORTS_PER_PROFILE) {
        return `Profile ${profileIndex + 1}: expected ${REPORT_ID.REPORTS_PER_PROFILE} reports, got ${reports.length}`;
    }

    for (let i = 0; i < reports.length; i++) {
        const report = reports[i];

        if (report.length !== BUFFER_SIZE) {
            return `Profile ${profileIndex + 1} report ${i + 1}: expected ${BUFFER_SIZE} bytes, got ${report.length}`;
        }

        if (report.length < REPORT_CRC_LENGTH) {
            return `Profile ${profileIndex + 1} report ${i + 1}: report too short for CRC`;
        }

        const expectedCrc = computeReportCrc(report);
        const actualCrc = Array.from(report.slice(report.length - REPORT_CRC_LENGTH));
        const matches = expectedCrc.every((byte, index) => byte === actualCrc[index]);

        if (!matches) {
            return `Profile ${profileIndex + 1} report ${i + 1}: CRC mismatch`;
        }
    }

    return null;
}

export function bytesArrayToProfile(bytesArray: Array<Array<number>>): Profile {

    const unassignedProfile: boolean = bytesArray[0][1] === 16;

    let leftJoystickCurrentCurveValues = [];
    let rightJoystickCurrentCurveValues = [];

    const assignmentDictionary = {
        0: ProfileButtonSelector.UNASSIGNED,
        112: ProfileButtonSelector.FN_TRIANGLE,
        115: ProfileButtonSelector.FN_SQUARE,
        118: ProfileButtonSelector.FN_CROSS,
        121: ProfileButtonSelector.FN_CIRCLE,
    }

    let label: string = "";
    let id: string = "";

    if (!unassignedProfile) {
        for (let i = 6; i < bytesArray[0].length - 4; i++) {
            if (bytesArray[0][i] !== 0) {
                label += String.fromCharCode(bytesArray[0][i]);
            }
        }

        for (let i = 2; i < 27; i++) {
            if (bytesArray[1][i] !== 0) {
                label += String.fromCharCode(bytesArray[1][i]);
            }
        }

        leftJoystickCurrentCurveValues = bytesArray[1].slice(47, 53);

        rightJoystickCurrentCurveValues = bytesArray[1].slice(56, 60);
        rightJoystickCurrentCurveValues.push(...bytesArray[2].slice(2, 4));

        id = bytesArray[1].slice(28, 44).join();
    } else {
        label = "Unassigned";
        leftJoystickCurrentCurveValues = [128, 128, 196, 196, 225, 225];
        rightJoystickCurrentCurveValues = [128, 128, 196, 196, 225, 225];
        for (let i = 1; i < 16; i++) {
            bytesArray[2][10 + i] = i;
        }
        bytesArray[2][5] = 0xFF;
        bytesArray[2][7] = 0xFF;

        id = bytesArray[1].slice(28, 44).join();
    }

    const profile = new Profile(
        id,
        label,
        new Joystick(PS5_JOYSTICK_CURVE[bytesArray[2][30]].getProfileId(), PS5_JOYSTICK_CURVE[bytesArray[2][30]].getAdjustments(), PS5_JOYSTICK_CURVE[bytesArray[2][30]].getModifier()),
        new Joystick(PS5_JOYSTICK_CURVE[bytesArray[2][32]].getProfileId(), PS5_JOYSTICK_CURVE[bytesArray[2][32]].getAdjustments(), PS5_JOYSTICK_CURVE[bytesArray[2][32]].getModifier()),
        new Trigger(bytesArray[2][4], bytesArray[2][5]),
        new Trigger(bytesArray[2][6], bytesArray[2][7]),
        new StickDeadzone(bytesArray[1][45]),
        new StickDeadzone(bytesArray[1][54]),
        new ButtonMapping(bytesArray[2].slice(10, 26)),
        // @ts-ignore
        assignmentDictionary[bytesArray[0][0]]
    );

    profile.getLeftJoyStick().setCurveValues(leftJoystickCurrentCurveValues);
    profile.getRightJoyStick().setCurveValues(rightJoystickCurrentCurveValues);

    return profile;
}

export function profileToBytes(profile: Profile): Array<Uint8Array> {

    let buffers: Array<Uint8Array> = [new Uint8Array(64), new Uint8Array(64), new Uint8Array(64)];

    buffers[0][0] = profile.getProfileButtonSelector();
    buffers[1][0] = profile.getProfileButtonSelector();
    buffers[2][0] = profile.getProfileButtonSelector();

    buffers[0][2] = 1;

    buffers[1][1] = 1;
    buffers[2][1] = 2;

    let label = profile.getLabel().split('');

    for (let i = 6; i < buffers[0].length - 4; i++) {
        if (!(i % 2) && label.length) {
            // @ts-ignore
            buffers[0][i] = label.shift().charCodeAt(0);
        }
    }

    for (let i = 2; i < 27; i++) {
        if (!(i % 2) && label.length) {
            // @ts-ignore
            buffers[1][i] = label.shift().charCodeAt(0);
        }
    }

    // Generated ID?
    buffers[1].set(profile.getId().split(',').map(elem => Number(elem)), 28);

    buffers[2][30] = profile.getLeftJoyStick().getProfileId();
    buffers[2][32] = profile.getRightJoyStick().getProfileId();

    buffers[1][44] = profile.getLeftJoyStick().getModifier();
    buffers[1][53] = profile.getRightJoyStick().getModifier();

    // Deep copy using JSON
    let joyConL = JSON.parse(JSON.stringify(profile.getLeftJoyStick().getCurveValues()));
    let joyConR = JSON.parse(JSON.stringify(profile.getRightJoyStick().getCurveValues()));

    for (let i = 47; i < 53; i++) {
        buffers[1][i] = joyConL.shift();
    }

    for (let i = 56; i < 60; i++) {
        buffers[1][i] = joyConR.shift();
    }

    buffers[2][2] = joyConR.shift();
    buffers[2][3] = joyConR.shift();

    buffers[2][4] = profile.getLeftTrigger().getMin();
    buffers[2][5] = profile.getLeftTrigger().getMax();
    buffers[2][6] = profile.getRightTrigger().getMin();
    buffers[2][7] = profile.getRightTrigger().getMax();

    // Stick deadzone values in Buffer 1
    const leftDeadzone = profile.getLeftStickDeadzone().getValue();
    const rightDeadzone = profile.getRightStickDeadzone().getValue();

    buffers[1][45] = leftDeadzone;
    buffers[1][54] = rightDeadzone;

    // Apply deadzone interpolation to curve values
    // Formula: NewValue = BaseValue + Round(Deadzone * (255 - BaseValue) / 255)
    // Left stick curve values are at bytes 47-52, right stick at 56-59 + buffer2[2-3]
    if (leftDeadzone > 0) {
        for (let i = 47; i < 53; i++) {
            const baseValue = buffers[1][i];
            const increment = Math.round(leftDeadzone * (255 - baseValue) / 255);
            buffers[1][i] = Math.min(255, baseValue + increment);
        }
    }
    if (rightDeadzone > 0) {
        for (let i = 56; i < 60; i++) {
            const baseValue = buffers[1][i];
            const increment = Math.round(rightDeadzone * (255 - baseValue) / 255);
            buffers[1][i] = Math.min(255, baseValue + increment);
        }
        // Also update the last 2 bytes in buffer 2
        for (let i = 2; i < 4; i++) {
            const baseValue = buffers[2][i];
            const increment = Math.round(rightDeadzone * (255 - baseValue) / 255);
            buffers[2][i] = Math.min(255, baseValue + increment);
        }
    }

    buffers[2].set(profile.getButtonMapping().getButtons(), 10);

    // Ignore paddle input?
    // buffers[2][28] = 0xC0;

    // DateTime area?
    buffers[2].set([0x1c, 0x55, 0xbb, 0x05, 0x87, 0x01], 34);

    buffers[2].set(arrayCRC32Le(buffers), 56);

    return buffers;
}
