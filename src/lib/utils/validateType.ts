import { Angle, ParameterType, ParameterValueType } from '../../types';

export default function validateType(type: ParameterType, value: ParameterValueType) {
    let isGood = true;
    switch (type) {
        case ParameterType.Number:
            isGood = typeof value === 'number';
            break;
        case ParameterType.Color:
            isGood = typeof value === 'object' && Object.hasOwn(value, 'type');
            break;
        case ParameterType.Font:
        case ParameterType.String:
            isGood = typeof value === 'string';
            break;
        case ParameterType.Size:
            isGood = typeof value === 'object' && Object.hasOwn(value, 'distance');
            break;
        case ParameterType.Angle:
            isGood = typeof value === 'object' &&
                Object.hasOwn(value, 'unit') &&
                [
                    'deg',
                    'rad',
                ].includes((value as Angle).unit);
            break;
        case ParameterType.Children:
            isGood = typeof value === 'object' && Object.hasOwn(value, 'length');
            break;
    }

    return isGood;
}