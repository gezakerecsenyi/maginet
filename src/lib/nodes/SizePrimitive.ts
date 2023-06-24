import Node from '../../nodes/Node';
import { DropdownSpecification, DropdownTyping } from '../../nodes/nodeTypes';
import { ParameterTyping, SizeUnit } from '../../types';
import Size from '../utils/Size';

export enum DropdownContext {
    SizeUnit = 'size',
}

export const SizePrimitive = new Node<'number' | 'unit', 'output'>(
    'size-primitive',
    'Size',
    [
        {
            id: 'number',
            displayName: 'Value',
            type: ParameterTyping.Number,
        },
        {
            id: 'unit',
            displayName: 'Unit',
            type: DropdownTyping.Dropdown,
            options: [
                [
                    'px',
                    SizeUnit.PX,
                ],
                [
                    'pt',
                    SizeUnit.PT,
                ],
                [
                    'mm',
                    SizeUnit.MM,
                ],
            ],
            dropdownName: DropdownContext.SizeUnit,
        } as DropdownSpecification<'unit'>,
    ],
    [
        {
            id: 'output',
            displayName: 'Result',
            type: ParameterTyping.Size,
        },
    ],
    (data) => {
        const number = data.getById('number')?.value;
        const unit = data.getById('unit')?.value;

        if (number !== undefined) {
            if (number.isArray) {
                return [
                    {
                        id: 'output',
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
                    id: 'output',
                    value: {
                        data: new Size(number.data as number, (unit?.data as SizeUnit) || SizeUnit.PX),
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