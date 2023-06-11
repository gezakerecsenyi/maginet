import { Angle, ParameterTyping, ParameterValueDatum } from '../../types';

export default function validateType(type: ParameterTyping, value: ParameterValueDatum) {
    let isGood = true;
    switch (type) {
        case ParameterTyping.Number:
            isGood = typeof value === 'number';
            break;
        case ParameterTyping.Color:
            isGood = typeof value === 'object' && Object.hasOwn(value, 'isColor');
            break;
        case ParameterTyping.Font:
        case ParameterTyping.String:
            isGood = typeof value === 'string';
            break;
        case ParameterTyping.Size:
            isGood = typeof value === 'object' && Object.hasOwn(value, 'distance');
            break;
        case ParameterTyping.Angle:
            isGood = typeof value === 'object' &&
                Object.hasOwn(value, 'unit') &&
                [
                    'deg',
                    'rad',
                ].includes((value as Angle).unit);
            break;
        case ParameterTyping.Children:
            isGood = typeof value === 'object' && Object.hasOwn(value, 'length');
            break;
    }

    return isGood;
}