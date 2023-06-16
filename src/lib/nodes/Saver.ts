import Node from '../../nodes/Node';
import { ParameterTyping } from '../../types';

// stub definition
export const Saver = new Node<'value', 'value'>(
    'saver',
    'Value store',
    [
        {
            id: 'value',
            displayName: 'Value',
            type: ParameterTyping.String,
        },
    ],
    [
        {
            id: 'value',
            displayName: 'Value',
            type: ParameterTyping.String,
        },
    ],
    (e) => e,
    (e) => e,
);