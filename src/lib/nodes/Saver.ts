import Node from '../../nodes/Node';
import { ParameterTyping } from '../../types';

// stub definition
export const Saver = new Node<string, 'value'>(
    'saver',
    'Value store',
    [
        {
            id: 'value',
            displayName: 'Value',
            type: ParameterTyping.String,
        },
    ],
    [],
    () => [],
    () => [],
);