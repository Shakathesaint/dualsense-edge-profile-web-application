export default class StickDeadzone {

    private value: number;

    constructor(value: number = 0x00) {
        this.value = value;
    }

    getValue(): number {
        return this.value;
    }

    setValue(value: number) {
        this.value = value;
    }
}
