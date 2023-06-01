import Component from '../render/Component';
import { SizeUnit, SpecialParameterId } from '../types';
import renderAsBlock from './utils/renderAsBlock';
import Size from './utils/Size';

export const Spread = new Component<SpecialParameterId>(
    [],
    true,
    [],
    renderAsBlock(new Size(420, SizeUnit.MM), new Size(297, SizeUnit.MM), 'spread'),
    'Spread',
    'A3 Spread',
    false,
    [
        {
            id: SpecialParameterId.X,
            value: 0,
        },
        {
            id: SpecialParameterId.Y,
            value: 0,
        },
    ],
);