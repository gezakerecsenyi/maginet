import getDefaultValueForType from '../lib/utils/getDefaultValueForType';
import SearchableMap from '../lib/utils/SearchableMap';
import { DefaultInputValue, NodeDatumSpecification, NodeEvaluator, NodeInputsSpecification } from './nodeTypes';

export default class Node<T extends string, Q extends string> {
    id: string;
    displayName: string;
    canAcceptArrays: boolean;
    inputs: SearchableMap<T, NodeInputsSpecification<T>>;
    outputs: SearchableMap<Q, NodeDatumSpecification<Q>>;
    defaults: SearchableMap<T, DefaultInputValue<T>>;
    evaluateForwards: NodeEvaluator<T, Q>;
    evaluateBackwards: NodeEvaluator<Q, T>;

    constructor(
        id: string,
        displayName: string,
        inputs: NodeInputsSpecification<T>[],
        outputs: NodeDatumSpecification<Q>[],
        evaluateForwards: NodeEvaluator<T, Q>,
        evaluateBackwards: NodeEvaluator<Q, T>,
        canAcceptArrays: boolean = true,
        defaults?: SearchableMap<T, DefaultInputValue<T>>,
    ) {
        this.id = id;
        this.displayName = displayName;
        this.inputs = new SearchableMap(...inputs);
        this.outputs = new SearchableMap(...outputs);
        this.evaluateForwards = evaluateForwards;
        this.evaluateBackwards = evaluateBackwards;
        this.canAcceptArrays = canAcceptArrays;

        this.defaults = this
            .inputs
            .sMap((e): DefaultInputValue<T> => {
                const lookup = defaults?.find(d => d.id === e.id);
                if (lookup) {
                    return lookup;
                }

                return {
                    id: e.id,
                    value: getDefaultValueForType(e.type, true),
                };
            });
    }
}