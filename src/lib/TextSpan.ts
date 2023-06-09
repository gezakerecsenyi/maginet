import Component from '../render/Component';
import { ParameterType, SpecialParameterId } from '../types';
import { Color } from './utils/Color';
import Size from './utils/Size';

export const TextSpan = new Component<'text' | 'color' | 'fontSize' | SpecialParameterId>(
    [
        {
            id: 'text',
            displayKey: 'Text content',
            type: ParameterType.String,
        },
        {
            id: 'fontSize',
            displayKey: 'Font size',
            type: ParameterType.Size,
        },
        {
            id: 'color',
            displayKey: 'Text color',
            type: ParameterType.Color,
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
        {
            id: 'text',
            value: 'A',
        },
    ],
    {
        width: ['fontSize'],
        height: [],
    },
);