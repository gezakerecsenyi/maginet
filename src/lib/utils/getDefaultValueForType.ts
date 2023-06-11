import { DropdownTyping } from '../../nodes/nodeTypes';
import { AngleUnit, ColorType, NodeValueDatum, ParameterTyping, ParameterValueDatum, SizeUnit } from '../../types';
import { Color } from './Color';
import Size from './Size';
import StringFragment from './StringFragment';

export default function getDefaultValueForType<T extends boolean = false>(
    type: T extends true ? (ParameterTyping | DropdownTyping) : ParameterTyping,
    useNodeTypes?: T,
): T extends true ? NodeValueDatum : ParameterValueDatum {
    switch (type) {
        case DropdownTyping.Dropdown:
            return 0;
        case ParameterTyping.Angle:
            return {
                angleSize: 90,
                unit: AngleUnit.Degrees,
            };
        case ParameterTyping.String:
            const defaultString = 'Lorem ipsum dolor sit amet';
            if (useNodeTypes) {
                return StringFragment.fromString(defaultString) as T extends true ? NodeValueDatum : ParameterValueDatum;
            }

            return defaultString as T extends true ? NodeValueDatum : ParameterValueDatum;
        case ParameterTyping.Number:
            return 1;
        case ParameterTyping.Size:
            return new Size(25, SizeUnit.MM);
        case ParameterTyping.Children:
            return [];
        case ParameterTyping.Boolean:
            return false;
        case ParameterTyping.Color:
            return new Color({
                type: ColorType.Solid,
                values: {
                    red: 255,
                    green: 0,
                    blue: 0,
                    alpha: 1,
                    noise: 0,
                },
            });
        case ParameterTyping.Font:
            return 'Arial';
        default:
            return false;
    }
}