import ParameterRelationshipEvaluator from '../nodes/ParameterRelationshipEvaluator';
import { Magazine, ParameterAssociationDescriptor, ParameterValueDatum } from '../types';
import ComponentInstance from './ComponentInstance';
import ComponentInstanceFactory from './ComponentInstanceFactory';

export interface ParameterCalculatorData {
    isReference: boolean;
    value?: ParameterValueDatum;
    tiedTo?: ParameterAssociationDescriptor;
    relationshipEvaluator?: ParameterRelationshipEvaluator;
}

export class ParameterCalculator<T extends string> {
    id: T;
    isReference: boolean;
    tiedTo?: ParameterAssociationDescriptor;
    value?: ParameterValueDatum;
    relationshipEvaluator?: ParameterRelationshipEvaluator;

    constructor(id: T, data: ParameterCalculatorData) {
        this.id = id;
        this.isReference = data.isReference;
        this.tiedTo = data.tiedTo;
        this.value = data.value;
        this.relationshipEvaluator = data.relationshipEvaluator;
    }

    resolveValue<Q extends boolean>(
        magazine: Magazine,
        isTopLevel: Q,
        searchSpace: Q extends true ? null : ComponentInstanceFactory[],
        foundAt: string[] = [],
    ): [ParameterValueDatum | null, string[], ComponentInstanceFactory | ComponentInstance | null] {
        if (!this.tiedTo || !this.isReference) {
            return [
                this.value!,
                foundAt.concat(this.id, 'value'),
                null,
            ];
        }

        if (isTopLevel) {
            for (const t of magazine.spreads) {
                const spread = t as ComponentInstance;

                if (spread.id === this.tiedTo.locationId) {
                    const res = spread
                        .parameterValues
                        .getById(this.tiedTo.id);
                    if (res) {
                        return [
                            this.relationshipEvaluator!.evaluate(res.value),
                            [
                                'spreads',
                                t.id,
                                'parameterValues',
                                this.tiedTo!.id,
                                'value',
                            ],
                            spread,
                        ];
                    }
                }
            }

            for (const component of magazine.customComponents) {
                const childContainers = component
                    .parameters
                    .asSecondaryKey(component.defaultParameterValues)
                    .filter(e => e?.isRenderedAsChildren);

                for (let childContainer of childContainers) {
                    const lookupHere = this.resolveValue(
                        magazine,
                        false,
                        childContainer.value as ComponentInstanceFactory<any>[],
                        [
                            'components',
                            component.id,
                            'defaultParameterValues',
                            childContainer.id,
                            'value',
                        ],
                    );

                    if (lookupHere[0] !== null) {
                        return [
                            this.relationshipEvaluator!.evaluate(lookupHere[0]),
                            lookupHere[1],
                            lookupHere[2],
                        ];
                    }
                }
            }

            for (const t of magazine.spreads) {
                const spread = t as ComponentInstance;

                const childParams = spread
                    .parameterValues
                    .asSecondaryKey(spread.component.parameters)
                    .filter(e => e.isRenderedAsChildren);
                for (let childList of childParams) {
                    if (childList) {
                        const childLookup = this.resolveValue(
                            magazine,
                            false,
                            childList.value as ComponentInstanceFactory[],
                            [
                                'spreads',
                                t.id,
                                'parameterValues',
                                childList.id,
                                'value',
                            ],
                        );
                        if (childLookup[0] !== null) {
                            return [
                                this.relationshipEvaluator!.evaluate(childLookup[0]),
                                childLookup[1],
                                childLookup[2],
                            ];
                        }
                    }
                }
            }
        } else {
            for (const t of searchSpace!) {
                const item = t as ComponentInstanceFactory;

                if (item.id === this.tiedTo.locationId) {
                    const res = item
                        .parameterMapping
                        .getById(this.tiedTo.id);

                    if (res) {
                        if (res.isReference) {
                            // we've found it!... but it's behind another reference
                            const foundBehind = res.resolveValue(
                                magazine,
                                true,
                                null,
                            );

                            if (foundBehind[0]) {
                                return [
                                    this.relationshipEvaluator!.evaluate(foundBehind[0]),
                                    foundBehind[1],
                                    foundBehind[2],
                                ];
                            }
                        } else {
                            return [
                                this.relationshipEvaluator!.evaluate(res.value!),
                                foundAt.concat(t.id, 'parameterMapping', this.tiedTo!.id, 'value'),
                                item,
                            ];
                        }
                    }
                }
            }

            for (const t of searchSpace!) {
                const item = t as ComponentInstanceFactory;

                const childParams = item
                    .parameterMapping
                    .asSecondaryKey(item.component.parameters)
                    .filter(e => e.isRenderedAsChildren);
                for (let childList of childParams) {
                    if (childList) {
                        if (childList.isReference) {
                            const resLookup = childList.resolveValue(
                                magazine,
                                true,
                                null,
                            );

                            if (resLookup[0] !== null) {
                                const childLookup = this.resolveValue(
                                    magazine,
                                    false,
                                    resLookup[0] as ComponentInstanceFactory[],
                                    resLookup[1],
                                );
                                if (childLookup[0] !== null) {
                                    return [
                                        this.relationshipEvaluator!.evaluate(childLookup[0]),
                                        childLookup[1],
                                        childLookup[2],
                                    ];
                                }
                            }
                        } else {
                            const childLookup = this.resolveValue(
                                magazine,
                                false,
                                childList.value as ComponentInstanceFactory[],
                                foundAt.concat(t.id, 'parameterMapping', childList.id),
                            );
                            if (childLookup[0] !== null) {
                                return [
                                    this.relationshipEvaluator!.evaluate(childLookup[0]),
                                    childLookup[1],
                                    childLookup[2],
                                ];
                            }
                        }
                    }
                }
            }
        }

        return [
            null,
            [],
            null,
        ];
    }
}