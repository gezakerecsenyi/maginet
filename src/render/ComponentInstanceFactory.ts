import { DefaultParameterId, Magazine, ParameterValueType } from '../types';
import Component from './Component';
import ComponentInstance from './ComponentInstance';

export interface ParameterAssociationDescriptor {
    locationId: string;
    parameterId: string;
}

export interface ParameterCalculator<T extends string> {
    parameterId: T;
    value?: ParameterValueType;
    tiedTo: ParameterAssociationDescriptor | null;
}

export type ComponentOf<R> = R extends Component<infer U> ? (U | DefaultParameterId) : never;

export default class ComponentInstanceFactory<R extends Component<ComponentOf<R>> = Component> {
    public component;
    public parameterMapping: ParameterCalculator<ComponentOf<R>>[];
    public id: string;

    constructor(component: R, parameterMapping: ParameterCalculator<ComponentOf<R>>[], id: string) {
        this.component = component;
        this.parameterMapping = parameterMapping;
        this.id = id;
    }

    static resolveParameterValue<Q extends boolean>(
        tiedTo: ParameterAssociationDescriptor,
        spreads: ComponentInstance[],
        components: Component[],
        isTopLevel: Q,
        searchSpace: Q extends true ? null : ComponentInstanceFactory[],
    ): ParameterValueType | null {
        if (isTopLevel) {
            for (const t of spreads) {
                const spread = t as ComponentInstance;

                if (spread.id === tiedTo.locationId) {
                    const res = spread.parameterValues.find(p => p.id === tiedTo.parameterId);
                    if (res) {
                        return res.value;
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
                        .find(p => p.parameterId === tiedTo.parameterId);

                    if (res) {
                        if (res.tiedTo === null) {
                            return res.value!;
                        } else {
                            return ComponentInstanceFactory.resolveParameterValue(
                                res.tiedTo,
                                spreads,
                                components,
                                true,
                                null,
                            );
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
                        .find(p => p.parameterId === idType);
                    if (childRes) {
                        if (childRes.value !== null) {
                            const childLookup = ComponentInstanceFactory.resolveParameterValue(
                                tiedTo,
                                spreads,
                                components,
                                false,
                                childRes.value as ComponentInstanceFactory[],
                            );
                            if (childLookup !== null) return childLookup;
                        } else {
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
                                    resLookup as ComponentInstanceFactory[],
                                );
                                if (childLookup !== null) return childLookup;
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    composeComponentInstance(magazine: Magazine) {
        return new ComponentInstance<ComponentOf<R>>(
            this.component,
            this.parameterMapping.map(p => ({
                ...this.component.parameters.find(e => e.id == p.parameterId)!,
                value: p.value ?? (ComponentInstanceFactory.resolveParameterValue(
                    p.tiedTo!,
                    magazine.spreads,
                    magazine.components,
                    true,
                    null,
                ) || 0),
            })),
            this.id,
            this,
        );
    }
}