import Node from '../../nodes/Node';
import { Add } from './Add';
import { ChildLength } from './ChildLength';
import { Saver } from './Saver';
import { SeparateSize } from './SeparateSize';
import { SizePrimitive } from './SizePrimitive';

export const availableNodes: Node<any, any>[] = [
    ChildLength,
    Saver,
    SizePrimitive,
    SeparateSize,
    Add,
];