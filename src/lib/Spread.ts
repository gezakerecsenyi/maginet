import Component from '../render/Component';
import { DefaultParameterId, SizeUnit } from '../types';
import renderAsBlock from './utils/renderAsBlock';
import Size from './utils/Size';

export const Spread = new Component<DefaultParameterId>(
    [],
    true,
    [],
    renderAsBlock(new Size(420, SizeUnit.MM), new Size(297, SizeUnit.MM), 'spread'),
    'Spread',
    'A3 Spread',
    false,
);