import Component from '../render/Component';
import { ParameterType, SpecialParameterId } from '../types';
import Size from './utils/Size';

export const TextSpan = new Component<'text' | 'fontSize' | SpecialParameterId>(
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
    ],
    false,
    [],
    (data) => {
        const span = document.createElement('span');
        span.innerText = data.getById('text')!.value as string;
        span.style.display = 'inline-block';
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
);