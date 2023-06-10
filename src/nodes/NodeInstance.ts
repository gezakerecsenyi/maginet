import SearchableMap from '../lib/utils/SearchableMap';
import Node from './Node';
import { NodeInputMapping } from './nodeTypes';

export default class NodeInstance<T extends string = string, Q extends string = string> {
    public id: string;
    public node: Node<T, Q>;
    public inputMappings: SearchableMap<T, NodeInputMapping<T>>;

    constructor(id: string, node: Node<T, Q>, inputMappings: NodeInputMapping<T>[]) {
        this.node = node;
        this.id = id;
        this.inputMappings = new SearchableMap(...inputMappings);
    }
}