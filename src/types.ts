import Component from './render/Component';
import ComponentInstance from './render/ComponentInstance';
import ComponentInstanceFactory from './render/ComponentInstanceFactory';
import Size from './lib/utils/Size';

export interface Magazine {
    spreads: ComponentInstance[];
    components: Component[];
}

export enum DefaultParameterId {
    X='x',
    Y='y',
    LayerDepth='layerDepth',
    Children='children',
    Contents='contents',
}

export enum ParameterType {
    Number,
    String,
    Color,
    Font,
    Size,
    Angle,
    Children,
}

export interface Parameter {
    displayKey: string;
    id: string;
    type: ParameterType;
}

export interface ColorPrimitive {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    noise: number;
}

export enum ColorType {
    Gradient,
    Solid,
}

export enum GradientType {
    Radial,
    Linear,
}

export interface GradientPoint {
    position: number;
    color: ColorPrimitive;
}

export interface Color {
    type: ColorType;
    gradientType?: GradientType;
    solidColor?: ColorPrimitive;
    gradientColor: GradientPoint[];
}

export type Font = string;

export enum SizeUnit {
    PX='px',
    PT='pt',
    MM='mm',
}

export enum AngleUnit {
    Degrees,
    Radians,
}

export interface Angle {
    value: number;
    unit: AngleUnit;
}

export type ParameterValueType = number | string | Color | Font | Size | Angle | ComponentInstanceFactory[];

export interface ParameterValue<T extends string = string> {
    id: T | DefaultParameterId;
    value: ParameterValueType,
}