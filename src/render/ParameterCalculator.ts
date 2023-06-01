import { Magazine, ParameterValueType } from '../types';
import ComponentInstance from './ComponentInstance';
import ComponentInstanceFactory, { ParameterAssociationDescriptor } from './ComponentInstanceFactory';

export interface ParameterCalculatorData {
    isReference: boolean;
    value?: ParameterValueType;
    tiedTo?: ParameterAssociationDescriptor;
}

export class ParameterCalculator<T extends string> {
    id: T;
    isReference: boolean;
    tiedTo?: ParameterAssociationDescriptor;
    value?: ParameterValueType;

    constructor(id: T, data: ParameterCalculatorData) {
        this.id = id;
        this.isReference = data.isReference;
        this.tiedTo = data.tiedTo;
        this.value = data.value;
    }

    resolveValue<Q extends boolean>(
        magazine: Magazine,
        isTopLevel: Q,
        searchSpace: Q extends true ? null : ComponentInstanceFactory[],
        foundAt: string[] = [],
    ): [ParameterValueType | null, string[]] {
        if (!this.tiedTo || !this.isReference) {
            return [
                this.value!,
                foundAt.concat(this.id, 'value'),
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
                            res.value,
                            [
                                'spreads',
                                t.id,
                                'parameterValues',
                                this.tiedTo!.id,
                                'value',
                            ],
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

                    if (lookupHere[0] !== null) return lookupHere;
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
                        if (childLookup[0] !== null) return childLookup;
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
                            return res.resolveValue(
                                magazine,
                                true,
                                null,
                            );
                        } else {
                            return [
                                res.value!,
                                foundAt.concat(t.id, 'parameterMapping', this.tiedTo!.id, 'value'),
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
                                if (childLookup[0] !== null) return childLookup;
                            }
                        } else {
                            const childLookup = this.resolveValue(
                                magazine,
                                false,
                                childList.value as ComponentInstanceFactory[],
                                foundAt.concat(t.id, 'parameterMapping', childList.id),
                            );
                            if (childLookup[0] !== null) return childLookup;
                        }
                    }
                }
            }
        }

        return [
            null,
            [],
        ];
    }
}