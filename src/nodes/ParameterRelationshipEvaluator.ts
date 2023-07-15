import SearchableMap from '../lib/utils/SearchableMap';
import StringFragment from '../lib/utils/StringFragment';
import toSentenceCase from '../lib/utils/toSentenceCase';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import { NodeValueDatum, ParameterTyping, ParameterValueDatum } from '../types';
import Node from './Node';
import NodeInstance from './NodeInstance';
import { IOType, NodeEvaluationCache, NodeIO, NodeIOValue, SpecialNodeIds } from './nodeTypes';

export default class ParameterRelationshipEvaluator {
    nodes: SearchableMap<string, NodeInstance<string, string>>;
    outputType: ParameterTyping;
    inputType: ParameterTyping;

    constructor(
        inputType: ParameterTyping,
        outputType: ParameterTyping,
        nodes?: SearchableMap<string, NodeInstance<string, string>>,
    ) {
        this.inputType = inputType;
        this.outputType = outputType;

        const inputNode = new NodeInstance(
            SpecialNodeIds.Input,
            new Node<string, 'value'>(
                SpecialNodeIds.Output,
                'Input',
                [],
                [
                    {
                        id: 'value',
                        displayName: toSentenceCase(inputType),
                        type: inputType,
                        datumType: IOType.Output,
                    },
                ],
                () => [],
                (e) => e,
            ),
            [],
            0,
            0,
        );
        this.nodes = nodes || new SearchableMap<string, NodeInstance<any, any>>(
            inputNode,
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
                            datumType: IOType.Input,
                        },
                    ],
                    [],
                    (e) => e,
                    () => [],
                ),
                inputType === outputType ? [
                    {
                        id: 'value',
                        isReference: true,
                        referenceTo: {
                            node: inputNode,
                            parameterId: 'value',
                        },
                    } as const,
                ] : [],
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
        currentInput: ParameterValueDatum,
        desiredOutput: ParameterValueDatum,
        ignoreIllegal: boolean = true,
    ) {
        const saverStore: NodeEvaluationCache = {};
        this.evaluate(currentInput, (id, datum) => {
            saverStore[id] = datum;
        });

        return this.evaluateBackwardsFromStore(desiredOutput, saverStore, ignoreIllegal);
    }

    evaluateBackwardsFromStore(
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
            console.log(`[${node.id}] currently evaluating node ${node.node.displayName} backwards`);
            if (evaluatedNodes.hasOwnProperty(node.id)) {
                console.log(`[${node.id}] found precomputed val:`, evaluatedNodes[node.id]);
                return evaluatedNodes[node.id];
            }

            if (node.node.id === SpecialNodeIds.Saver) {
                console.log(`[${node.id}] found as saver: ${saverStore[node.id]}`);
                return saverStore[node.id];
            }

            console.log(`[${node.id}] resolving sources...`);
            const sources = node
                .node
                .outputs
                .sMap((output): NodeIO<string> => {
                    console.log(`[${node.id}] [s ${output.id}] looking at output ${output.displayName}`);
                    const inputNodeData = this
                        .nodes
                        .map(compNode => [
                                compNode,
                                compNode
                                    .inputMappings
                                    .find(input =>
                                        input.isReference &&
                                        input.referenceTo!.node.id === node.id &&
                                        input.referenceTo!.parameterId === output.id,
                                    ),
                            ] as const,
                        )
                        .filter(e => e[1])
                        .map(t => evaluateNode(t[0])?.getById(t[1]!.id)?.value || null);

                    console.log(`[${node.id}] [s ${output.id}] completed resolution - got raw data:`, inputNodeData);
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

                    console.log(`[${node.id}] [s ${output.id}] cleaned raw data to`, allNodeData);

                    if (allNodeData.length) {
                        console.log(`[${node.id}] [s ${output.id}] length > 1:`, {
                            id: output.id,
                            value: {
                                isArray: true,
                                data: allNodeData,
                            },
                        });
                        return {
                            id: output.id,
                            value: {
                                isArray: true,
                                data: allNodeData,
                            },
                        };
                    } else if (allNodeData.length === 1) {
                        console.log(`[${node.id}] [s ${output.id}] length = 1:`, {
                            id: output.id,
                            value: {
                                isArray: false,
                                data: allNodeData[0],
                            },
                        });
                        return {
                            id: output.id,
                            value: {
                                isArray: false,
                                data: allNodeData[0],
                            },
                        };
                    }

                    console.log(`[${node.id}] [s ${output.id}] got null:`, {
                        id: output.id,
                        value: {
                            isArray: false,
                            data: null,
                        },
                    });
                    return {
                        id: output.id,
                        value: {
                            isArray: false,
                            data: null,
                        },
                    };
                });
            console.log(`[${node.id}] resolved sources:`, sources);

            const knownInputs = node
                .inputMappings
                .sFilter(t => !t.isReference)
                .sMap(t => ({
                    id: t.id,
                    value: t.value!,
                }));
            console.log(`[${node.id}] got fixed inputs:`, knownInputs);

            const res = node.node.evaluateBackwards(sources, knownInputs, ignoreIllegal);
            console.log(`[${node.id}] requested backwards evaluation with res:`, res);
            if (res !== null) {
                const value = new SearchableMap(...res);
                evaluatedNodes[node.id] = value;

                console.log(`[${node.id}] res is positive, sending:`, value);
                return value;
            } else {
                console.log(`[${node.id}] res is null, sending null`);
                return null;
            }
        };

        console.log(`[EVAL] start - `, output);
        const res = evaluateNode(inputNode);
        if (res !== null) {
            const inputData = res.getById('value')!.value;
            console.log(`[EVAL] res is positive, sending`, inputData, `from`, res);

            return ParameterRelationshipEvaluator.toParameterDatum(inputData, this.inputType);
        } else {
            console.log(`[EVAL] res is null, sending null`);
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

        const usedSavers = new Set<string>();
        const evaluateNode = (instance: NodeInstance): SearchableMap<string, NodeIO<string>> | null => {
            if (evaluatedNodes.hasOwnProperty(instance.id)) {
                return evaluatedNodes[instance.id];
            }

            const sources = instance
                .inputMappings
                .sMap((input): NodeIO<string> => {
                    if (!input.isReference) {
                        return {
                            id: input.id,
                            value: input.value!,
                        };
                    }

                    const lookup = evaluateNode(input.referenceTo!.node);
                    if (lookup !== null) {
                        return {
                            ...lookup.getById(input.referenceTo!.parameterId)!,
                            id: input.id,
                        };
                    }

                    return {
                        id: input.id,
                        value: {
                            data: null,
                            isArray: false,
                        },
                    };
                });

            const res = instance.node.evaluateForwards(sources);
            if (res !== null) {
                const value = new SearchableMap(...res);
                evaluatedNodes[instance.id] = value;

                if (instance.node.id === SpecialNodeIds.Saver && onSaver && !usedSavers.has(instance.id)) {
                    usedSavers.add(instance.id);
                    onSaver(instance.id, value);
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
                .sFilter(t => !usedSavers.has(t.id))
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