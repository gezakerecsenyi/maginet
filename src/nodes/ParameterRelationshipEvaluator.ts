import SearchableMap from '../lib/utils/SearchableMap';
import toSentenceCase from '../lib/utils/toSentenceCase';
import { ParameterType, ParameterValueType } from '../types';
import Node from './Node';
import NodeInstance from './NodeInstance';
import { NodeIO } from './nodeTypes';

export default class ParameterRelationshipEvaluator {
    nodes: SearchableMap<string, NodeInstance<any, any>>;
    outputType: ParameterType;
    inputType: ParameterType;

    constructor(inputType: ParameterType, outputType: ParameterType) {
        this.inputType = inputType;
        this.outputType = outputType;

        this.nodes = new SearchableMap<string, NodeInstance<any, any>>(
            new NodeInstance(
                'input',
                new Node<string, 'value'>(
                    'input',
                    'Input',
                    [],
                    [
                        {
                            id: 'value',
                            displayName: toSentenceCase(outputType),
                            type: outputType,
                        },
                    ],
                    () => [],
                    () => [],
                ),
                [],
            ),
            new NodeInstance(
                'output',
                new Node<'value', string>(
                    'output',
                    'Output',
                    [
                        {
                            id: 'value',
                            displayName: toSentenceCase(outputType),
                            type: outputType,
                        },
                    ],
                    [],
                    () => [],
                    () => [],
                ),
                [],
            ),
        );
    }

    evaluate(source: ParameterValueType, isForwards: boolean = true): ParameterValueType {
        const exitNode = this.nodes.getById(isForwards ? 'output' : 'input')!;

        const evaluatedNodes: { [key: string]: SearchableMap<string, NodeIO<string>> } = {
            [isForwards ? 'input' : 'output']: new SearchableMap(
                {
                    id: isForwards ? 'input' : 'output',
                    value: {
                        data: source,
                        isArray: false,
                    },
                },
            ),
        };
        const evaluateNode = (node: NodeInstance): SearchableMap<string, NodeIO<string>> => {
            if (evaluatedNodes.hasOwnProperty(node.id)) {
                return evaluatedNodes[node.id];
            }

            const sources = node
                .inputMappings
                .sMap((input): NodeIO<string> => {
                    if (!input.isReference) {
                        return {
                            id: input.id,
                            value: input.value!,
                        };
                    }

                    return evaluateNode(
                        this.nodes.getById(input.referenceTo!.locationId)!,
                    ).getById(input.referenceTo!.locationId)!;
                });

            const value = new SearchableMap(
                ...(
                    isForwards ? node.node.evaluateForwards(sources) : node.node.evaluateBackwards(sources)
                ),
            );
            evaluatedNodes[node.id] = value;

            return value;
        };

        return evaluateNode(exitNode).getById(isForwards ? 'output' : 'input')!.value.data as ParameterValueType;
    }
}