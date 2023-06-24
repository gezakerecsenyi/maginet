import getDefaultValueForType from '../lib/utils/getDefaultValueForType';
import SearchableMap from '../lib/utils/SearchableMap';
import { Optional } from '../types';
import { DefaultInputValue, IOType, NodeDatumSpecification, NodeEvaluator, NodeInputsSpecification } from './nodeTypes';

export default class Node<T extends string, Q extends string> {
    id: string;
    displayName: string;
    canAcceptArrays: boolean;
    inputs: SearchableMap<T, NodeInputsSpecification<T>>;
    outputs: SearchableMap<Q, NodeDatumSpecification<Q, IOType.Output>>;
    defaults: SearchableMap<T, DefaultInputValue<T>>;
    evaluateForwards: NodeEvaluator<T, Q>;
    evaluateBackwards: NodeEvaluator<Q, T>;

    constructor(
        id: string,
        displayName: string,
        inputs: Optional<NodeInputsSpecification<T>, 'datumType'>[],
        outputs: Optional<NodeDatumSpecification<Q, IOType.Output>, 'datumType'>[],
        evaluateForwards: NodeEvaluator<T, Q>,
        evaluateBackwards: NodeEvaluator<Q, T>,
        canAcceptArrays: boolean = true,
        defaults?: DefaultInputValue<T>[],
    ) {
        this.id = id;
        this.displayName = displayName;

        this.inputs = new SearchableMap(...inputs.map(e => ({
            ...e,
            datumType: IOType.Input,
        }) as NodeInputsSpecification<T>));
        this.outputs = new SearchableMap(...outputs.map(e => ({
            ...e,
            datumType: IOType.Output,
        }) as NodeDatumSpecification<Q, IOType.Output>));

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