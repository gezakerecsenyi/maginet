import Node from '../../nodes/Node';
import ComponentInstanceFactory from '../../render/ComponentInstanceFactory';
import { ParameterTyping } from '../../types';

export const ChildLength = new Node<'children', 'count'>(
    'child-length',
    'Count components',
    [
        {
            id: 'children',
            displayName: 'Components',
            type: ParameterTyping.Children,
        },
    ],
    [
        {
            id: 'count',
            displayName: 'Count',
            type: ParameterTyping.Number,
        },
    ],
    (data) => {
        const input = data.getById('children')?.value;

        if (input) {
            if (input.isArray) {
                return [
                    {
                        id: 'count',
                        value: {
                            data: (input.data as ComponentInstanceFactory[][]).map(e => e.length),
                            isArray: true,
                        },
                    },
                ];
            }

            return [
                {
                    id: 'count',
                    value: {
                        data: (input.data as ComponentInstanceFactory[]).length,
                        isArray: false,
                    },
                },
            ];
        }

        return null;
    },
    () => {
        return null;
    },
);