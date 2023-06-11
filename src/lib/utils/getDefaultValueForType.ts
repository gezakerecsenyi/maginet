import { AngleUnit, ColorType, ParameterTyping, ParameterValueDatum, SizeUnit } from '../../types';
import { Color } from './Color';
import Size from './Size';

export default function getDefaultValueForType(type: ParameterTyping): ParameterValueDatum {
    switch (type) {
        case ParameterTyping.Angle:
            return {
                angleSize: 90,
                unit: AngleUnit.Degrees,
            };
        case ParameterTyping.String:
            return 'Lorem ipsum dolor sit amet';
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
    }
}