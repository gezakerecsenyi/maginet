import SearchableMap from '../lib/utils/SearchableMap';
import Node from './Node';
import { IOType, NodeInputMapping } from './nodeTypes';

export default class NodeInstance<T extends string = string, Q extends string = string> {
    public id: string;
    public node: Node<T, Q>;
    public x: number;
    public y: number;
    public isSpec = false;

    constructor(id: string, node: Node<T, Q>, inputMappings: NodeInputMapping<T>[], x: number, y: number) {
        this.node = node;
        this.id = id;
        this.inputMappings = new SearchableMap(...inputMappings);

        this.x = x;
        this.y = y;
    }

    private _inputMappings!: SearchableMap<T, NodeInputMapping<T>>;

    get inputMappings() {
        return this._inputMappings;
    }

    set inputMappings(value) {
        this._inputMappings = this
            .node
            .inputs
            .sMap((q): NodeInputMapping<T> => {
                if (value.some(t => t.id === q.id)) {
                    return value.getById(q.id)!;
                }

                return {
                    id: q.id,
                    isReference: false,
                    value: {
                        isArray: false,
                        data: this.node.defaults.getById(q.id)!.value,
                    },
                    datumType: IOType.Input,
                };
            });
    }
}