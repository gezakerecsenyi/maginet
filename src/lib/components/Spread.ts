import Component from '../../render/Component';
import { ParameterTyping, SizeUnit, SpecialParameterId } from '../../types';
import { ParameterCalculator } from '../utils/ParameterCalculator';
import renderAsBlock from '../utils/renderAsBlock';
import Size from '../utils/Size';

export const Spread = new Component<'moving-x'>(
    [
        {
            id: 'moving-x',
            type: ParameterTyping.Size,
            displayKey: 'X Movement tracker',
        },
    ],
    true,
    [],
    renderAsBlock(new Size(420, SizeUnit.MM), new Size(297, SizeUnit.MM), 'spread'),
    'Spread',
    'A3 Spread',
    false,
    [
        new ParameterCalculator(
            SpecialParameterId.X,
            {
                isReference: false,
                value: new Size(0, SizeUnit.PX),
            },
        ),
        new ParameterCalculator(
            SpecialParameterId.Y,
            {
                isReference: false,
                value: new Size(0, SizeUnit.PX),
            },
        ),
    ],
);