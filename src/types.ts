import { Color } from './lib/utils/Color';
import SearchableMap from './lib/utils/SearchableMap';
import Size from './lib/utils/Size';
import StringFragment from './lib/utils/StringFragment';
import Component from './render/Component';
import ComponentInstance from './render/ComponentInstance';
import ComponentInstanceFactory from './render/ComponentInstanceFactory';
import RenderContext from './render/RenderContext';

export interface Magazine {
    spreads: ComponentInstance<any>[];
    customComponents: Component[];
}

export enum SpecialParameterId {
    X = 'x',
    Y = 'y',
    LayerDepth = 'layerDepth',
    Children = 'children',
    Contents = 'contents',
    Width = 'width',
    Height = 'height',
}

export enum ParameterTyping {
    Number = 'number',
    String = 'string',
    Color = 'color',
    Font = 'font',
    Size = 'size',
    Angle = 'angle',
    Boolean = 'boolean',
    Children = '(children)',
}

export interface Parameter {
    displayKey: string;
    id: string;
    type: ParameterTyping;
    isRenderedAsChildren?: boolean;
    isImmutable?: boolean;
}

export enum RerenderOption {
    All,
    PreviewsAndLinked,
    Previews,
    None,
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

export enum ComponentCompositionType {
    Instance,
    Factory,
}

export enum GradientType {
    Radial = 'radial',
    Linear = 'linear',
}

export interface GradientPoint {
    position: number;
    color: Color<ColorType.Solid>;
}

export type Font = string;

export enum SizeUnit {
    PX = 'px',
    PT = 'pt',
    MM = 'mm',
}

export enum AngleUnit {
    Degrees = 'deg',
    Radians = 'rad',
}

export interface Angle {
    angleSize: number;
    unit: AngleUnit;
}

export type ParameterValueDatum =
    number
    | string
    | Color
    | Font
    | Size
    | Angle
    | ComponentInstanceFactory<any>[]
    | boolean;
export type NodeValueDatum = ParameterValueDatum | StringFragment | null;

export interface ParameterValue<T extends string = string> {
    id: T | SpecialParameterId;
    value: ParameterValueDatum,
}

export interface HistoryState extends Magazine {

}

export enum SpecialClasses {
    NoSelect = '-no-select',
    DatumPropertyLabel = 'property-label',
    DatumValueLabel = 'value-label',
    GeneratedBlock = 'generated-rendered-block',
    SelectionBoxComponent = 'selection-box-component',
    TopLevelSpread = '-top-level-spread',
    ReferenceTarget = 'reference-target',
    ReferenceSource = 'reference-source',
    NodeEditor = 'node-editor',
}

export enum ToolType {
    Cursor = 'tool-cursor',
    Text = 'tool-text',
    Image = 'tool-image',
    Shape = 'tool-shape',
    Nodes = 'tool-nodes',
    Component = 'tool-component',

    Circle = 'tool-circle',
    Rectangle = 'tool-rectangle',
    Triangle = 'tool-triangle',

    TextFragment = 'tool-text-fragment',
    RichText = 'tool-rich-text',
}

export type RenderMethod<T extends string> = (
    parameterValue: SearchableMap<T | SpecialParameterId, ParameterValue<T>>,
    renderer: RenderContext,
) => HTMLElement;

export interface ParametersFrom<T extends string> extends Omit<Parameter, 'id'> {
    id: T | SpecialParameterId,
}

export type ImmutableSpecialParameters = SpecialParameterId.Contents;

export interface ToolbarOptionData {
    tooltip: string;
    optionType: ToolType;
    suboptions?: ToolbarOptionData[];
    insertableByDrag?: Component<any>;
}

export type UIBindingSpec<T extends string> = {
    width: (T | SpecialParameterId)[];
    height: (T | SpecialParameterId)[];
}

export interface ParameterAssociationDescriptor {
    locationId: string;
    id: SpecialParameterId | string;
}