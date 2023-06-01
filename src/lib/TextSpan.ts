import Component from '../render/Component';
import { DefaultParameterId, ParameterType } from '../types';
import Size from './utils/Size';

export const TextSpan = new Component<'text' | DefaultParameterId>(
    [
        {
            id: 'text',
            displayKey: 'Text content',
            type: ParameterType.String,
        },
    ],
    false,
    [],
    (data) => {
        const span = document.createElement('span');
        span.innerText = data.getById('text')!.value as string;
        span.style.backgroundColor = '#aaaaff';
        span.style.display = 'inline-block';
        span.style.width = (data.getById(DefaultParameterId.Width)!.value as Size).toCSSString();
        return span;
    },
    'TextSpan',
    'Text segment',
);