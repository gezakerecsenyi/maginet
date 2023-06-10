import SearchableMap from '../lib/utils/SearchableMap';
import { NodeDatumSpecification, NodeEvaluator } from './nodeTypes';

export default class Node<T extends string, Q extends string> {
    id: string;
    displayName: string;
    inputs: SearchableMap<T, NodeDatumSpecification<T>>;
    outputs: SearchableMap<Q, NodeDatumSpecification<Q>>;
    evaluateForwards: NodeEvaluator<T, Q>;
    evaluateBackwards: NodeEvaluator<Q, T>;

    constructor(
        id: string,
        displayName: string,
        inputs: NodeDatumSpecification<T>[],
        outputs: NodeDatumSpecification<Q>[],
        evaluateForwards: NodeEvaluator<T, Q>,
        evaluateBackwards: NodeEvaluator<Q, T>,
    ) {
        this.id = id;
        this.displayName = displayName;
        this.inputs = new SearchableMap(...inputs);
        this.outputs = new SearchableMap(...outputs);
        this.evaluateForwards = evaluateForwards;
        this.evaluateBackwards = evaluateBackwards;
    }
}