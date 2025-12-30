import Profile from "../model/Profile";
import Joystick from "../model/Joystick";
import Trigger from "../model/Trigger";
import ButtonMapping from "../model/ButtonMapping";
import {ProfileButtonSelector} from "../enum/ProfileButtonSelector";
import {PS5_JOYSTICK_CURVE} from "./bytesToProfile";
import {generateId} from "./profileTools";

const EXPORT_VERSION = "1.0";

export interface ExportedJoystick {
  profileId: number;
  curveValues: number[];
  modifier: number;
}

export interface ExportedTrigger {
  min: number;
  max: number;
}

export interface ExportedProfile {
  version: string;
  exportedAt: string;
  profile: {
    label: string;
    leftJoystick: ExportedJoystick;
    rightJoystick: ExportedJoystick;
    leftTrigger: ExportedTrigger;
    rightTrigger: ExportedTrigger;
    buttonMapping: number[];
  };
}

export function profileToJSON(profile: Profile): ExportedProfile {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: {
      label: profile.getLabel(),
      leftJoystick: {
        profileId: profile.getLeftJoyStick().getProfileId(),
        curveValues: [...profile.getLeftJoyStick().getCurveValues()],
        modifier: profile.getLeftJoyStick().getModifier()
      },
      rightJoystick: {
        profileId: profile.getRightJoyStick().getProfileId(),
        curveValues: [...profile.getRightJoyStick().getCurveValues()],
        modifier: profile.getRightJoyStick().getModifier()
      },
      leftTrigger: {
        min: profile.getLeftTrigger().getMin(),
        max: profile.getLeftTrigger().getMax()
      },
      rightTrigger: {
        min: profile.getRightTrigger().getMin(),
        max: profile.getRightTrigger().getMax()
      },
      buttonMapping: [...profile.getButtonMapping().getButtons()]
    }
  };
}

export function jsonToProfile(data: ExportedProfile): Profile {
  if (!data.version) {
    throw new Error("Invalid profile format: missing version");
  }

  const p = data.profile;

  if (!p.label || !p.leftJoystick || !p.rightJoystick ||
      !p.leftTrigger || !p.rightTrigger || !p.buttonMapping) {
    throw new Error("Invalid profile format: missing required fields");
  }

  if (p.leftJoystick.profileId < 0 || p.leftJoystick.profileId > 5 ||
      p.rightJoystick.profileId < 0 || p.rightJoystick.profileId > 5) {
    throw new Error("Invalid joystick profile ID");
  }

  if (p.leftJoystick.curveValues.length !== 6 ||
      p.rightJoystick.curveValues.length !== 6) {
    throw new Error("Invalid curve values: must have 6 values");
  }

  if (p.buttonMapping.length !== 16) {
    throw new Error("Invalid button mapping: must have 16 values");
  }

  if (p.leftTrigger.min < 0 || p.leftTrigger.min > 255 ||
      p.leftTrigger.max < 0 || p.leftTrigger.max > 255 ||
      p.rightTrigger.min < 0 || p.rightTrigger.min > 255 ||
      p.rightTrigger.max < 0 || p.rightTrigger.max > 255) {
    throw new Error("Invalid trigger values: must be 0-255");
  }

  const leftJoystick = new Joystick(
    p.leftJoystick.profileId,
    PS5_JOYSTICK_CURVE[p.leftJoystick.profileId].getAdjustments(),
    p.leftJoystick.modifier
  );
  leftJoystick.setCurveValues(p.leftJoystick.curveValues);

  const rightJoystick = new Joystick(
    p.rightJoystick.profileId,
    PS5_JOYSTICK_CURVE[p.rightJoystick.profileId].getAdjustments(),
    p.rightJoystick.modifier
  );
  rightJoystick.setCurveValues(p.rightJoystick.curveValues);

  return new Profile(
    generateId(),
    p.label,
    leftJoystick,
    rightJoystick,
    new Trigger(p.leftTrigger.min, p.leftTrigger.max),
    new Trigger(p.rightTrigger.min, p.rightTrigger.max),
    new ButtonMapping(p.buttonMapping),
    ProfileButtonSelector.UNASSIGNED
  );
}

export function downloadProfileAsJSON(profile: Profile): void {
  const exportData = profileToJSON(profile);
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.getLabel().replace(/[^a-z0-9]/gi, '_')}_profile.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
