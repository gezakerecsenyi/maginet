import Component from '../../render/Component';
import { ParameterTyping, SpecialParameterId } from '../../types';
import { Color } from '../utils/Color';
import { ParameterCalculator } from '../utils/ParameterCalculator';
import Size from '../utils/Size';

export const TextSpan = new Component<'text' | 'color' | 'fontSize' | SpecialParameterId>(
    [
        {
            id: 'text',
            displayKey: 'Text content',
            type: ParameterTyping.String,
        },
        {
            id: 'fontSize',
            displayKey: 'Font size',
            type: ParameterTyping.Size,
        },
        {
            id: 'color',
            displayKey: 'Text color',
            type: ParameterTyping.Color,
        },
    ],
    false,
    [],
    (data) => {
        const span = document.createElement('span');
        span.innerText = data.getById('text')!.value as string;
        span.style.display = 'inline-block';
        span.style.width = 'max-content';
        span.style.color = (data.getById('color')!.value as Color).toCSSString();
        span.style.fontSize = (data.getById('fontSize')!.value as Size).toCSSString();
        return span;
    },
    'TextSpan',
    'Text segment',
    true,
    [
        new ParameterCalculator(
            'text',
            {
                value: 'A',
                isReference: false,
            },
        ),
    ],
    {
        width: ['fontSize'],
        height: [],
    },
);