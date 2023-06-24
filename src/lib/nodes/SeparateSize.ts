import Node from '../../nodes/Node';
import { ParameterTyping, SizeUnit } from '../../types';
import Size from '../utils/Size';

import { DropdownContext } from './SizePrimitive';

export const SeparateSize = new Node<'input', 'number' | 'unit'>(
    'separate-size',
    'Separate size units',
    [
        {
            id: 'input',
            displayName: 'Size',
            type: ParameterTyping.Size,
        },
    ],
    [
        {
            id: 'number',
            displayName: 'Value',
            type: ParameterTyping.Number,
        },
        {
            id: 'unit',
            displayName: 'Unit',
            type: ParameterTyping.String,
            dropdownContext: DropdownContext.SizeUnit,
        },
    ],
    (data) => {
        const input = data.getById('input')?.value;

        if (input !== undefined) {
            if (input.isArray) {
                return [
                    {
                        id: 'number',
                        value: {
                            data: (input.data as Size[]).map(e => e.distance),
                            isArray: true,
                        },
                    },
                    {
                        id: 'unit',
                        value: {
                            data: (input.data as Size[]).map(e => e.unit),
                            isArray: true,
                        },
                    },
                ];
            }

            return [
                {
                    id: 'number',
                    value: {
                        data: (input.data as Size).distance,
                        isArray: false,
                    },
                },
                {
                    id: 'unit',
                    value: {
                        data: (input.data as Size).unit,
                        isArray: false,
                    },
                },
            ];
        }

        return null;
    },
    (data) => {
        const number = data.getById('number')?.value;
        const unit = data.getById('unit')?.value;

        if (number !== undefined) {
            if (number.isArray) {
                return [
                    {
                        id: 'input',
                        value: {
                            data: (number.data as number[]).map(e => new Size(
                                e,
                                (unit?.data as SizeUnit) || SizeUnit.PX,
                            )),
                            isArray: true,
                        },
                    },
                ];
            }

            return [
                {
                    id: 'input',
                    value: {
                        data: new Size(number.data as number, (unit?.data as SizeUnit) || SizeUnit.PX),
                        isArray: false,
                    },
                },
            ];
        }

        return null;
    },
);