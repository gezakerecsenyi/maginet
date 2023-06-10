import Node from '../../nodes/Node';
import ComponentInstanceFactory from '../../render/ComponentInstanceFactory';
import { ParameterType } from '../../types';

export const ChildLength = new Node<'children', 'count'>(
    'child-length',
    'Count components',
    [
        {
            id: 'children',
            displayName: 'Components',
            type: ParameterType.Children,
        },
    ],
    [
        {
            id: 'count',
            displayName: 'Count',
            type: ParameterType.Number,
        },
    ],
    (data) => {
        return [
            {
                id: 'count',
                value: (data.getById('children')?.value as ComponentInstanceFactory[]).length,
            },
        ];
    },
);