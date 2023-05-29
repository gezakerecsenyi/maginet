import { SizeUnit } from '../../types';

export default class Size {
    public value: number;
    public unit: SizeUnit;

    constructor(value: number, unit: SizeUnit) {
        this.value = value;
        this.unit = unit;
    }

    toString() {
        return `${this.value}${this.unit}`;
    }
}