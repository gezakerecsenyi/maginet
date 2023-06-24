import Node from '../../nodes/Node';
import { ParameterTyping } from '../../types';

export const Add = new Node<'a' | 'b', 'res'>(
    'add',
    'Add',
    [
        {
            id: 'a',
            displayName: 'Input',
            type: ParameterTyping.Number,
        },
        {
            id: 'b',
            displayName: 'Input',
            type: ParameterTyping.Number,
        },
    ],
    [
        {
            id: 'res',
            displayName: 'Sum',
            type: ParameterTyping.Number,
        },
    ],
    (data) => {
        const a = data.getById('a')?.value;
        const b = data.getById('b')?.value;

        if (a !== undefined && b !== undefined) {
            if (a.isArray || b.isArray) {
                const aData: number[] = a.isArray ?
                    a.data as number[] :
                    Array((b.data as number[]).length).fill(a.data as number);
                const bData: number[] = b.isArray ?
                    b.data as number[] :
                    Array((a.data as number[]).length).fill(b.data as number);

                return [
                    {
                        id: 'res',
                        value: {
                            isArray: true,
                            data: aData.length >= bData.length ?
                                aData.map((e, i) => e + (bData[i] || 0)) :
                                bData.map((e, i) => e + (aData[i] || 0)),
                        },
                    },
                ];
            }

            return [
                {
                    id: 'res',
                    value: {
                        isArray: false,
                        data: (a.data as number) + (b.data as number),
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