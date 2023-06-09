import { SizeUnit } from '../../types';
import { PopulatedWindow } from '../../window';

export default class Size {
    public distance: number;
    public unit: SizeUnit;

    constructor(distance: number, unit: SizeUnit) {
        this.distance = distance;
        this.unit = unit;
    }

    toCSSString(roundTo = 8) {
        return `${Math.round(this.distance * Math.pow(10, roundTo)) / Math.pow(10, roundTo)}${this.unit}`;
    }

    add(addend: Size) {
        return new Size(
            this.toType(SizeUnit.PX).distance + addend.toType(SizeUnit.PX).distance,
            SizeUnit.PX,
        ).toType(this.unit);
    }

    subtract(addend: Size) {
        return this.add(new Size(-addend.distance, addend.unit));
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
            if (toType === SizeUnit.MM) value = this.distance;
            if (toType === SizeUnit.PT) value = this.distance / mmInPT;
            if (toType === SizeUnit.PX) value = this.distance * pxInMM;
        }

        if (this.unit === SizeUnit.PT) {
            if (toType === SizeUnit.MM) value = this.distance * mmInPT;
            if (toType === SizeUnit.PT) value = this.distance;
            if (toType === SizeUnit.PX) value = this.distance * pxInPT;
        }

        if (this.unit === SizeUnit.PX) {
            if (toType === SizeUnit.MM) value = this.distance / pxInMM;
            if (toType === SizeUnit.PT) value = this.distance / pxInPT;
            if (toType === SizeUnit.PX) value = this.distance;
        }

        return new Size(value, toType);
    }
}