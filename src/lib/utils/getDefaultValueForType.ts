import { AngleUnit, ColorType, ParameterType, ParameterValueType, SizeUnit } from '../../types';
import { Color } from './Color';
import Size from './Size';

export default function getDefaultValueForType(type: ParameterType): ParameterValueType {
    switch (type) {
        case ParameterType.Angle:
            return {
                angleSize: 90,
                unit: AngleUnit.Degrees,
            };
        case ParameterType.String:
            return 'Lorem ipsum dolor sit amet';
        case ParameterType.Number:
            return 1;
        case ParameterType.Size:
            return new Size(25, SizeUnit.MM);
        case ParameterType.Children:
            return [];
        case ParameterType.Color:
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
        case ParameterType.Font:
            return 'Arial';
    }
}