import Joystick from "./Joystick";
import Trigger from "./Trigger";
import StickDeadzone from "./StickDeadzone";
import {ProfileButtonSelector} from "../enum/ProfileButtonSelector";
import ButtonMapping from "./ButtonMapping";

export default class Profile {

    private id: string;
    private label: string;

    private leftJoystick: Joystick;
    private rightJoystick: Joystick;

    private leftTrigger: Trigger;
    private rightTrigger: Trigger;

    private leftStickDeadzone: StickDeadzone;
    private rightStickDeadzone: StickDeadzone;

    private buttonMapping: ButtonMapping;

    private profileButtonSelector: ProfileButtonSelector;

    constructor(
        id: string = "",
        label: string = "Label",
        leftJoystick: Joystick,
        rightJoystick: Joystick,
        leftTrigger: Trigger,
        rightTrigger: Trigger,
        leftStickDeadzone: StickDeadzone,
        rightStickDeadzone: StickDeadzone,
        buttonMapping: ButtonMapping,
        profileButtonSelector: ProfileButtonSelector = ProfileButtonSelector.UNASSIGNED
    ) {
        this.id = id;
        this.label = label;
        this.leftJoystick = leftJoystick;
        this.rightJoystick = rightJoystick;
        this.leftTrigger = leftTrigger;
        this.rightTrigger = rightTrigger;
        this.leftStickDeadzone = leftStickDeadzone;
        this.rightStickDeadzone = rightStickDeadzone;
        this.buttonMapping = buttonMapping;
        this.profileButtonSelector = profileButtonSelector;
    }

    getId(): string {
        return this.id;
    }

    setId(value: string) {
        this.id = value;
    }

    getLabel(): string {
        return this.label;
    }

    setLabel(value: string) {
        this.label = value;
    }

    getLeftJoyStick(): Joystick {
        return this.leftJoystick;
    }

    setLeftJoyStick(value: Joystick) {
        this.leftJoystick = value;
    }

    getRightJoyStick(): Joystick {
        return this.rightJoystick;
    }

    setRightJoyStick(value: Joystick) {
        this.rightJoystick = value;
    }

    getLeftTrigger(): Trigger {
        return this.leftTrigger;
    }

    setLeftTrigger(value: Trigger) {
        this.leftTrigger = value;
    }

    getRightTrigger(): Trigger {
        return this.rightTrigger;
    }

    setRightTrigger(value: Trigger) {
        this.rightTrigger = value;
    }

    getLeftStickDeadzone(): StickDeadzone {
        return this.leftStickDeadzone;
    }

    setLeftStickDeadzone(value: StickDeadzone) {
        this.leftStickDeadzone = value;
    }

    getRightStickDeadzone(): StickDeadzone {
        return this.rightStickDeadzone;
    }

    setRightStickDeadzone(value: StickDeadzone) {
        this.rightStickDeadzone = value;
    }

    getButtonMapping(): ButtonMapping {
        return this.buttonMapping;
    }

    setButtonMapping(value: ButtonMapping) {
        this.buttonMapping = value;
    }


    getProfileButtonSelector(): ProfileButtonSelector {
        return this.profileButtonSelector;
    }

    setProfileButtonSelector(value: ProfileButtonSelector) {
        this.profileButtonSelector = value;
    }
}