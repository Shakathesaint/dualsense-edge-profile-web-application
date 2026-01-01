import Profile from "../model/Profile";
import Joystick from "../model/Joystick";
import Trigger from "../model/Trigger";
import StickDeadzone from "../model/StickDeadzone";
import ButtonMapping from "../model/ButtonMapping";
import { ProfileButtonSelector } from "../enum/ProfileButtonSelector";
import { PS5_JOYSTICK_CURVE } from "./bytesToProfile";
import { generateId } from "./profileTools";
import { devWarn } from "./errors";
import JSZip from "jszip";

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

export interface ExportedStickDeadzone {
  value: number;
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
    leftStickDeadzone?: ExportedStickDeadzone;
    rightStickDeadzone?: ExportedStickDeadzone;
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
      leftStickDeadzone: {
        value: profile.getLeftStickDeadzone().getValue()
      },
      rightStickDeadzone: {
        value: profile.getRightStickDeadzone().getValue()
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

  // Validate stick deadzone if present (backward compatibility: optional)
  // Values are stored as bytes (0-255), where 255 = 100%
  if (p.leftStickDeadzone && (p.leftStickDeadzone.value < 0 || p.leftStickDeadzone.value > 255)) {
    throw new Error("Invalid left stick deadzone: must be 0-255");
  }
  if (p.rightStickDeadzone && (p.rightStickDeadzone.value < 0 || p.rightStickDeadzone.value > 255)) {
    throw new Error("Invalid right stick deadzone: must be 0-255");
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
    new StickDeadzone(p.leftStickDeadzone?.value ?? 0),
    new StickDeadzone(p.rightStickDeadzone?.value ?? 0),
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

// Bulk export/import interfaces and functions

export interface BulkExportMetadata {
  version: string;
  exportedAt: string;
  profileCount: number;
  appName: string;
}

export interface ImportResult {
  imported: Profile[];
  renamed: { original: string; newName: string }[];
  errors: string[];
}

export function resolveNameConflict(name: string, existingNames: string[]): string {
  if (!existingNames.includes(name)) {
    return name;
  }

  let counter = 2;
  let newName = `${name} (${counter})`;
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${name} (${counter})`;
  }
  return newName;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-\s]/gi, '_').substring(0, 50);
}

export async function exportProfilesToZip(profiles: Profile[]): Promise<Blob> {
  const zip = new JSZip();

  const metadata: BulkExportMetadata = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profileCount: profiles.length,
    appName: "DualSense Edge Profile Manager"
  };

  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  const profilesFolder = zip.folder("profiles");
  if (!profilesFolder) {
    throw new Error("Failed to create profiles folder in ZIP");
  }

  const usedFilenames = new Set<string>();
  for (const profile of profiles) {
    const exportData = profileToJSON(profile);
    const json = JSON.stringify(exportData, null, 2);

    let filename = sanitizeFilename(profile.getLabel());
    if (usedFilenames.has(filename.toLowerCase())) {
      let counter = 2;
      while (usedFilenames.has(`${filename}_${counter}`.toLowerCase())) {
        counter++;
      }
      filename = `${filename}_${counter}`;
    }
    usedFilenames.add(filename.toLowerCase());

    profilesFolder.file(`${filename}.json`, json);
  }

  return await zip.generateAsync({ type: "blob" });
}

export async function importProfilesFromZip(
  file: File,
  existingNames: string[]
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: [],
    renamed: [],
    errors: []
  };

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("Invalid ZIP file format");
  }

  const metadataFile = zip.file("metadata.json");
  if (metadataFile) {
    try {
      const metadataContent = await metadataFile.async("string");
      const metadata = JSON.parse(metadataContent) as BulkExportMetadata;
      if (metadata.version !== EXPORT_VERSION) {
        devWarn(`ZIP version mismatch: expected ${EXPORT_VERSION}, got ${metadata.version}`);
      }
    } catch {
      devWarn("Could not read metadata.json, continuing anyway");
    }
  }

  const profilesFolder = zip.folder("profiles");
  const profileFiles = profilesFolder
    ? Object.keys(zip.files).filter(
      (path) => path.startsWith("profiles/") && path.endsWith(".json")
    )
    : Object.keys(zip.files).filter((path) => path.endsWith(".json") && path !== "metadata.json");

  const currentNames = [...existingNames];

  for (const filePath of profileFiles) {
    const zipFile = zip.file(filePath);
    if (!zipFile) continue;

    try {
      const content = await zipFile.async("string");
      const data = JSON.parse(content) as ExportedProfile;
      const profile = jsonToProfile(data);

      const originalName = profile.getLabel();
      const resolvedName = resolveNameConflict(originalName, currentNames);

      if (resolvedName !== originalName) {
        profile.setLabel(resolvedName);
        result.renamed.push({ original: originalName, newName: resolvedName });
      }

      currentNames.push(resolvedName);
      result.imported.push(profile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`${filePath}: ${errorMessage}`);
    }
  }

  return result;
}

export async function downloadProfilesAsZip(profiles: Profile[]): Promise<Blob> {
  const blob = await exportProfilesToZip(profiles);

  const date = new Date().toISOString().split("T")[0];
  const filename = `dualsense_profiles_backup_${date}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return blob;
}
