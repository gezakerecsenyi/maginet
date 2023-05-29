import Component from '../render/Component';
import { DefaultParameterId, ParameterType } from '../types';

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
        span.innerText = data.find(q => q.id === 'text')!.value as string;
        return span;
    },
    'TextSpan',
    'Text segment',
);