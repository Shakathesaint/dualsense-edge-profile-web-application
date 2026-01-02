import Joystick from "../model/Joystick";
import { PS5_JOYSTICK_CURVE } from "./bytesToProfile";

export const byteToPercent = (byteValue: number): number => {
    return Math.round(byteValue * 100 / 255);
};

export const percentToByte = (percent: number): number => {
    return Math.round(percent * 255 / 100);
};

export const getCurrentCurveIndex = (joystick: Joystick): number => {
    let indexCurve: number;
    const profileId = joystick.getProfileId();

    // Guard against invalid profile IDs
    if (!PS5_JOYSTICK_CURVE[profileId]) return 0;

    for (indexCurve = 0; indexCurve <= 10; indexCurve++) {
        // We compare stringified arrays to check for equality of curve adjustments
        let arrAdjustments = PS5_JOYSTICK_CURVE[profileId].getAdjustments().map(curve => curve.getByIndex(indexCurve));
        if (arrAdjustments.toString() === joystick.getCurveValues().toString()) break;
    }

    return Math.min(indexCurve, 10); // Clamp to valid range (0-10)
}
