import SearchableMap from '../lib/utils/SearchableMap';
import { DefaultParameterId, Magazine, ParameterValueType } from '../types';
import Component from './Component';
import ComponentInstance from './ComponentInstance';

export interface ParameterAssociationDescriptor {
    locationId: string;
    id: DefaultParameterId | string;
}

export interface ParameterCalculator<T extends string> {
    id: T;
    value?: ParameterValueType;
    tiedTo?: ParameterAssociationDescriptor;
    isReference: boolean;
}

export type ComponentOf<R> = R extends Component<infer U> ? (U | DefaultParameterId) : never;

export default class ComponentInstanceFactory<R extends Component<ComponentOf<R>> = Component> {
    public component;
    public parameterMapping: SearchableMap<ParameterCalculator<ComponentOf<R>>>;
    public id: string;

    constructor(component: R, parameterMapping: ParameterCalculator<ComponentOf<R>>[], id: string) {
        this.component = component;
        this.parameterMapping = new SearchableMap(...parameterMapping);
        this.id = id;
    }

    static resolveParameterValue<Q extends boolean>(
        tiedTo: ParameterAssociationDescriptor,
        spreads: ComponentInstance[],
        components: Component[],
        isTopLevel: Q,
        searchSpace: Q extends true ? null : ComponentInstanceFactory[],
        foundAt: string[] = [],
    ): [ParameterValueType | null, string[]] {
        if (isTopLevel) {
            for (const t of spreads) {
                const spread = t as ComponentInstance;

                if (spread.id === tiedTo.locationId) {
                    const res = spread.parameterValues.find(p => p.id === tiedTo.id);
                    if (res) {
                        return [
                            res.value,
                            [
                                'spreads',
                                t.id,
                                'parameterValues',
                                tiedTo.id,
                                'value',
                            ],
                        ];
                    }
                }
            }

            for (const component of components) {
                // components can't themselves have params, so we can just jump straight to looking at children
                const lookupHere = ComponentInstanceFactory.resolveParameterValue(
                    tiedTo,
                    spreads,
                    components,
                    false,
                    component.contents,
                    [
                        'components',
                        component.id,
                        'contents',
                    ],
                );

                if (lookupHere !== null) return lookupHere;
            }

            for (const t of spreads) {
                const spread = t as ComponentInstance;

                for (let idType of [
                    DefaultParameterId.Children,
                    DefaultParameterId.Contents,
                ]) {
                    const childRes = spread
                        .parameterValues
                        .find(p => p.id === idType);
                    if (childRes) {
                        const childLookup = ComponentInstanceFactory.resolveParameterValue(
                            tiedTo,
                            spreads,
                            components,
                            false,
                            childRes.value as ComponentInstanceFactory[],
                            [
                                'spreads',
                                t.id,
                                'parameterValues',
                                idType,
                                'value',
                            ],
                        );
                        if (childLookup !== null) return childLookup;
                    }
                }
            }
        } else {
            for (const t of searchSpace!) {
                const item = t as ComponentInstanceFactory;

                if (item.id === tiedTo.locationId) {
                    const res = item
                        .parameterMapping
                        .find(p => p.id === tiedTo.id);

                    if (res) {
                        if (res.isReference) {
                            return ComponentInstanceFactory.resolveParameterValue(
                                res.tiedTo!,
                                spreads,
                                components,
                                true,
                                null,
                            );
                        } else {
                            return [
                                res.value!,
                                foundAt.concat(t.id, 'parameterMapping', tiedTo.id, 'value'),
                            ];
                        }
                    }
                }
            }

            for (const t of searchSpace!) {
                const item = t as ComponentInstanceFactory;

                for (let idType of [
                    DefaultParameterId.Children,
                    DefaultParameterId.Contents,
                ]) {
                    const childRes = item
                        .parameterMapping
                        .find(p => p.id === idType);
                    if (childRes) {
                        if (childRes.isReference) {
                            const resLookup = ComponentInstanceFactory.resolveParameterValue(
                                childRes.tiedTo!,
                                spreads,
                                components,
                                true,
                                null,
                            );

                            if (resLookup) {
                                const childLookup = ComponentInstanceFactory.resolveParameterValue(
                                    tiedTo,
                                    spreads,
                                    components,
                                    false,
                                    resLookup[0] as ComponentInstanceFactory[],
                                    resLookup[1],
                                );
                                if (childLookup !== null) return childLookup;
                            }
                        } else {
                            const childLookup = ComponentInstanceFactory.resolveParameterValue(
                                tiedTo,
                                spreads,
                                components,
                                false,
                                childRes.value as ComponentInstanceFactory[],
                                foundAt.concat(t.id, 'parameterMapping', idType),
                            );
                            if (childLookup !== null) return childLookup;
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

    composeComponentInstance(magazine: Magazine) {
        return new ComponentInstance<ComponentOf<R>>(
            this.component,
            this.parameterMapping.map(p => ({
                ...this.component.parameters.find(e => e.id == p.id)!,
                value: p.value ?? (ComponentInstanceFactory.resolveParameterValue(
                    p.tiedTo!,
                    magazine.spreads,
                    magazine.components,
                    true,
                    null,
                )[0] || 0),
            })),
            this.id,
            this,
        );
    }
}