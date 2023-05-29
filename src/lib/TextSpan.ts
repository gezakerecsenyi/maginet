import Component from '../render/Component';
import { ParameterType, SizeUnit } from '../types';
import renderAsBlock from './utils/renderAsBlock';
import Size from './utils/Size';

export const TextSpan = new Component<'text'>(
    [
        {
            id: 'text',
            displayKey: 'Text content',
            type: ParameterType.String,
        }
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