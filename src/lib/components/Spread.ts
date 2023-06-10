import Component from '../../render/Component';
import { ParameterType, SizeUnit, SpecialParameterId } from '../../types';
import renderAsBlock from '../utils/renderAsBlock';
import Size from '../utils/Size';

export const Spread = new Component<'moving-x'>(
    [
        {
            id: 'moving-x',
            type: ParameterType.Size,
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
        {
            id: SpecialParameterId.X,
            value: new Size(0, SizeUnit.PX),
        },
        {
            id: SpecialParameterId.Y,
            value: new Size(0, SizeUnit.PX),
        },
    ],
);