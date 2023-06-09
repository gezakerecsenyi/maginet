import { ColorPrimitive, ColorType, GradientPoint, GradientType } from '../../types';

export interface GradientData {
    gradientColor: GradientPoint[];
    gradientType: GradientType;
    type: ColorType.Gradient;
}

export interface SolidColorData {
    values: ColorPrimitive;
    type: ColorType.Solid;
}

export type ColorData<T extends ColorType> = T extends ColorType.Gradient ? GradientData : SolidColorData;

export class Color<T extends ColorType = ColorType> {
    public readonly isColor = true; // for type detection
    private readonly data: ColorData<T>;

    constructor(data: ColorData<T>) {
        this.data = data;
    }

    get type() {
        return this.data.type;
    }

    get solidColor() {
        if (this.data.type === ColorType.Solid) {
            return this.data.values;
        }
    }

    set solidColor(color) {
        if (this.data.type === ColorType.Solid && color) {
            this.data.values = color;
        }
    }

    get gradientType() {
        if (this.data.type === ColorType.Gradient) {
            return this.data.gradientType;
        }
    }

    set gradientType(type) {
        if (this.data.type === ColorType.Gradient && type) {
            this.data.gradientType = type;
        }
    }

    get gradientColor() {
        if (this.data.type === ColorType.Gradient) {
            return this.data.gradientColor;
        }
    }

    set gradientColor(color) {
        if (this.data.type === ColorType.Gradient && color) {
            this.data.gradientColor = color;
        }
    }

    isGradient(): this is Color<ColorType.Gradient> {
        return this.type === ColorType.Gradient;
    }

    isSolid(): this is Color<ColorType.Solid> {
        return this.type === ColorType.Solid;
    }

    toCSSString(): string {
        if (this.isSolid()) {
            return `rgba(${this.solidColor!.red}, ${this.solidColor!.green}, ${this.solidColor!.blue}, ${this.solidColor!.alpha})`;
        } else {
            return `${this.gradientType!}-gradient(90deg, ${
                this
                    .gradientColor!
                    .map(e => `${e.color.toCSSString()} ${e.position * 100}%`)
                    .join(', ')
            })`;
        }
    }

    toType<R extends ColorType>(type: R): Color<R> {
        if (this.type === type) {
            return new Color({ ...this.data }) as unknown as Color<R>;
        }

        if (type === ColorType.Gradient) {
            return new Color<ColorType.Gradient>({
                type,
                gradientType: GradientType.Linear,
                gradientColor: [
                    {
                        position: 0,
                        color: this as Color<ColorType.Solid>,
                    },
                ],
            }) as Color<R>;
        }

        return new Color<ColorType.Solid>({
            type,
            values: this.gradientColor![0].color.solidColor!,
        }) as Color<R>;
    }
}