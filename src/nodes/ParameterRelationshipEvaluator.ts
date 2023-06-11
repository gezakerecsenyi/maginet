import SearchableMap from '../lib/utils/SearchableMap';
import StringFragment from '../lib/utils/StringFragment';
import toSentenceCase from '../lib/utils/toSentenceCase';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import { NodeValueDatum, ParameterTyping, ParameterValueDatum } from '../types';
import Node from './Node';
import NodeInstance from './NodeInstance';
import { NodeEvaluationCache, NodeIO, NodeIOValue, SpecialNodeIds } from './nodeTypes';

export default class ParameterRelationshipEvaluator {
    nodes: SearchableMap<string, NodeInstance<any, any>>;
    outputType: ParameterTyping;
    inputType: ParameterTyping;

    constructor(
        inputType: ParameterTyping,
        outputType: ParameterTyping,
        nodes?: SearchableMap<string, NodeInstance<any, any>>,
    ) {
        this.inputType = inputType;
        this.outputType = outputType;

        this.nodes = nodes || new SearchableMap<string, NodeInstance<any, any>>(
            new NodeInstance(
                SpecialNodeIds.Input,
                new Node<string, 'value'>(
                    SpecialNodeIds.Output,
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
                0,
                0,
            ),
            new NodeInstance(
                SpecialNodeIds.Output,
                new Node<'value', string>(
                    SpecialNodeIds.Output,
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
                100,
                0,
            ),
        );
    }

    static toNodeValue(value: ParameterValueDatum, typeHint: ParameterTyping): NodeIOValue {
        if (typeHint === ParameterTyping.String) {
            return {
                data: StringFragment.fromString(value as string),
                isArray: false,
            };
        }

        return {
            data: (value as Exclude<ParameterValueDatum, string>),
            isArray: false,
        };
    }

    static toParameterDatum(value: NodeIOValue, typeHint: ParameterTyping): ParameterValueDatum | null {
        if (value.isArray) {
            if (typeHint === ParameterTyping.String) {
                return (value.data as StringFragment[])
                    .reduce<StringFragment | null | undefined>(
                        (a, e) => a?.mergeWith(e),
                        new StringFragment(),
                    )
                    ?.flattenToString() || null;
            }

            if (typeHint === ParameterTyping.Children) {
                return (value.data as ComponentInstanceFactory[][]).flat();
            }

            return (value.data as ParameterValueDatum[])[0];
        }

        if (typeHint === ParameterTyping.String) {
            return (value.data as StringFragment).flattenToString();
        }

        return value.data as ParameterValueDatum | null;
    }

    evaluateBackwards(
        output: ParameterValueDatum,
        saverStore: NodeEvaluationCache = {},
        ignoreIllegal: boolean = false,
    ): ParameterValueDatum | null {
        const inputNode = this.nodes.getById(SpecialNodeIds.Input)!;

        const evaluatedNodes: NodeEvaluationCache = {
            [SpecialNodeIds.Output]: new SearchableMap(
                {
                    id: 'value',
                    value: ParameterRelationshipEvaluator.toNodeValue(output, this.outputType),
                },
            ),
            ...saverStore,
        };
        const evaluateNode = (node: NodeInstance): SearchableMap<string, NodeIO<string>> | null => {
            if (evaluatedNodes.hasOwnProperty(node.id)) {
                return evaluatedNodes[node.id];
            }

            if (node.node.id === SpecialNodeIds.Saver) {
                return saverStore[node.id];
            }

            const sources = node
                .node
                .outputs
                .sMap((output): NodeIO<string> => {
                    const inputNodeData = this
                        .nodes
                        .map(compNode => [
                                compNode,
                                compNode
                                    .inputMappings
                                    .find(input =>
                                        input.isReference &&
                                        input.referenceTo!.locationId === node.id &&
                                        input.referenceTo!.id === output.id,
                                    ),
                            ] as const,
                        )
                        .filter(e => e[1])
                        .map(t => evaluateNode(t[0])?.getById(t[1]!.id)?.value || null);

                    const allNodeData: NodeValueDatum[] = [];
                    inputNodeData.forEach(value => {
                        if (value === null) {
                            allNodeData.push(null);
                            return;
                        }

                        if (!value.isArray) {
                            allNodeData.push(value.data as NodeValueDatum);
                        } else {
                            allNodeData.push(...value.data as NodeValueDatum[]);
                        }
                    });

                    if (allNodeData.length) {
                        return {
                            id: output.id,
                            value: {
                                isArray: true,
                                data: allNodeData,
                            },
                        };
                    } else if (allNodeData.length === 1) {
                        return {
                            id: output.id,
                            value: {
                                isArray: false,
                                data: allNodeData[0],
                            },
                        };
                    }

                    return {
                        id: output.id,
                        value: {
                            isArray: false,
                            data: null,
                        },
                    };
                });

            const knownInputs = node
                .inputMappings
                .sFilter(t => !t.isReference)
                .sMap(t => ({
                    id: t.id,
                    value: t.value!,
                }));

            const res = node.node.evaluateBackwards(sources, knownInputs, ignoreIllegal);
            if (res !== null) {
                const value = new SearchableMap(...res);
                evaluatedNodes[node.id] = value;

                return value;
            } else {
                return null;
            }
        };

        const res = evaluateNode(inputNode);
        if (res !== null) {
            const inputData = res.getById('value')!.value;

            return ParameterRelationshipEvaluator.toParameterDatum(inputData, this.inputType);
        } else {
            return null;
        }
    }

    evaluate(
        input: ParameterValueDatum,
        onSaver?: (id: string, datum: SearchableMap<string, NodeIO<string>>) => void,
    ): ParameterValueDatum | null {
        const exitNode = this.nodes.getById(SpecialNodeIds.Output)!;

        const evaluatedNodes: NodeEvaluationCache = {
            [SpecialNodeIds.Input]: new SearchableMap(
                {
                    id: 'value',
                    value: ParameterRelationshipEvaluator.toNodeValue(input, this.inputType),
                },
            ),
        };
        const evaluateNode = (node: NodeInstance): SearchableMap<string, NodeIO<string>> | null => {
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

                    const lookup = evaluateNode(
                        this.nodes.getById(input.referenceTo!.locationId)!,
                    );
                    if (lookup !== null) {
                        return lookup.getById(input.referenceTo!.locationId)!;
                    }

                    return {
                        id: input.id,
                        value: {
                            data: null,
                            isArray: false,
                        },
                    };
                });

            const res = node.node.evaluateForwards(sources);
            if (res !== null) {
                const value = new SearchableMap(...res);
                evaluatedNodes[node.id] = value;

                if (node.node.id === SpecialNodeIds.Saver && onSaver) {
                    onSaver(node.id, value);
                }

                return value;
            } else {
                return null;
            }
        };

        const res = evaluateNode(exitNode);

        if (onSaver) {
            this
                .nodes
                .sFilter(t => t.node.id === SpecialNodeIds.Saver)
                .forEach(node => {
                    evaluateNode(node);
                });
        }

        if (res !== null) {
            const data = res.getById('value')!.value;

            return ParameterRelationshipEvaluator.toParameterDatum(data, this.outputType);
        } else {
            return null;
        }
    }
}