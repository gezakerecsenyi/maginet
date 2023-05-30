import { SizeUnit } from '../../types';
import { PopulatedWindow } from '../../window';

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

    add(addend: Size) {
        return new Size(
            this.toType(SizeUnit.PX).value + addend.toType(SizeUnit.PX).value,
            SizeUnit.PX,
        ).toType(this.unit);
    }

    subtract(addend: Size) {
        return this.add(new Size(-addend.value, addend.unit));
    }

    toType(toType: SizeUnit) {
        let {
            pxInPT,
            pxInMM,
        } = window as PopulatedWindow;
        pxInMM = pxInMM || 3.7795;
        pxInPT = pxInPT || 1.3333;
        let mmInPT = pxInPT / pxInMM;

        let value = 0;
        if (this.unit === SizeUnit.MM) {
            if (toType === SizeUnit.MM) value = this.value;
            if (toType === SizeUnit.PT) value = this.value / mmInPT;
            if (toType === SizeUnit.PX) value = this.value * pxInMM;
        }

        if (this.unit === SizeUnit.PT) {
            if (toType === SizeUnit.MM) value = this.value * mmInPT;
            if (toType === SizeUnit.PT) value = this.value;
            if (toType === SizeUnit.PX) value = this.value * pxInPT;
        }

        if (this.unit === SizeUnit.PX) {
            if (toType === SizeUnit.MM) value = this.value / pxInMM;
            if (toType === SizeUnit.PT) value = this.value / pxInPT;
            if (toType === SizeUnit.PX) value = this.value;
        }

        return new Size(value, toType);
    }
}