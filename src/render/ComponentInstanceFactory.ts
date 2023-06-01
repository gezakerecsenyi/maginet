import MaginetError from '../lib/utils/MaginetError';
import SearchableMap from '../lib/utils/SearchableMap';
import updateFromLocation from '../lib/utils/updateFromLocation';
import Maginet from '../Maginet';
import {
    Angle,
    ImmutableSpecialParameters,
    Magazine,
    ParameterType,
    ParameterValueType,
    SpecialParameterId,
} from '../types';
import { EditMode } from '../ui/SpreadRenderer';
import { PopulatedWindow } from '../window';
import Component from './Component';
import ComponentInstance from './ComponentInstance';

export interface ParameterAssociationDescriptor {
    locationId: string;
    id: SpecialParameterId | string;
}

export interface ParameterCalculator<T extends string> {
    id: T;
    value?: ParameterValueType;
    tiedTo?: ParameterAssociationDescriptor;
    isReference: boolean;
}

export type ParameterOf<R> = (R extends Component<infer U> ? U : never) | SpecialParameterId;
export type ParameterMap<R extends Component<ParameterOf<R>>> = SearchableMap<ParameterOf<R>, ParameterCalculator<ParameterOf<R>>>;

export default class ComponentInstanceFactory<R extends Component<ParameterOf<R>> = Component> {
    public component;
    public id: string;

    constructor(
        component: R,
        parameterMapping: ParameterCalculator<Exclude<ParameterOf<R>, ImmutableSpecialParameters>>[],
        id: string,
    ) {
        this.component = component;
        this.parameterMapping = new SearchableMap(...parameterMapping);
        this.id = id;
    }

    private _parameterMapping!: ParameterMap<R>;

    get parameterMapping() {
        return this._parameterMapping;
    }

    set parameterMapping(value: ParameterMap<R>) {
        this._parameterMapping = this.component.withDefaults(value) as ParameterMap<R>;
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
                    component
                        .defaultParameterValues
                        .find(e => e.id === SpecialParameterId.Contents)!
                        .value as ComponentInstanceFactory<any>[],
                    [
                        'components',
                        component.id,
                        'defaultParameterValues',
                        SpecialParameterId.Contents,
                        'value',
                    ],
                );

                if (lookupHere !== null) return lookupHere;
            }

            for (const t of spreads) {
                const spread = t as ComponentInstance;

                const childParams = spread
                    .parameterValues
                    .filter(e => spread
                        .component
                        .parameters
                        .getById(e.id)
                        ?.isRenderedAsChildren,
                    );
                for (let childList of childParams) {
                    if (childList) {
                        const childLookup = ComponentInstanceFactory.resolveParameterValue(
                            tiedTo,
                            spreads,
                            components,
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

                const childParams = item
                    .parameterMapping
                    .filter(e => item
                        .component
                        .parameters
                        .getById(e.id)
                        ?.isRenderedAsChildren,
                    );
                for (let childList of childParams) {
                    if (childList) {
                        if (childList.isReference) {
                            const resLookup = ComponentInstanceFactory.resolveParameterValue(
                                childList.tiedTo!,
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
                                childList.value as ComponentInstanceFactory[],
                                foundAt.concat(t.id, 'parameterMapping', childList.id),
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

    static getInstanceId(instance: ComponentInstanceFactory<any>): string {
        return `${instance.id}-${instance.component.id}`;
    }

    getInstanceId(): string {
        return ComponentInstanceFactory.getInstanceId(this);
    }

    respectfullyUpdateParameter(
        maginet: Maginet,
        parameter: ParameterOf<R>,
        update: (currentValue: ParameterValueType, foundAt?: string[]) => ParameterValueType,
    ) {
        const parameterHere = this
            .parameterMapping
            .getById(parameter);

        if (!parameterHere?.isReference) {
            this
                .parameterMapping
                .updateById(
                    parameter,
                    {
                        value: update(parameterHere!.value!),
                    },
                );
        } else if (parameterHere) {
            let [resolvedValue, resolvedValueLocation] = ComponentInstanceFactory.resolveParameterValue(
                parameterHere.tiedTo!,
                maginet.magazine.spreads,
                maginet.magazine.customComponents,
                true,
                null,
            );

            if (maginet.spreadRenderer.editMode === EditMode.Value) {
                if (resolvedValue !== null) {
                    this
                        .parameterMapping
                        .updateById(
                            parameter,
                            {
                                value: update(resolvedValue!),
                                isReference: false,
                            },
                        );
                }
            } else if (maginet.spreadRenderer.editMode === EditMode.Reference) {
                if (resolvedValueLocation.length) {
                    updateFromLocation(
                        maginet.magazine,
                        update(resolvedValue!, resolvedValueLocation),
                        resolvedValueLocation,
                    );
                }
            }
        }
    }

    composeComponentInstance(magazine: Magazine) {
        return new ComponentInstance<ParameterOf<R>>(
            this.component,
            this.parameterMapping.map(p => {
                const valueHere = p.value ?? (ComponentInstanceFactory.resolveParameterValue(
                    p.tiedTo!,
                    magazine.spreads,
                    magazine.customComponents,
                    true,
                    null,
                )[0] || 0);

                const parameterDetails = this.component.parameters.getById(p.id)!;
                if ((window as PopulatedWindow).debug) {
                    let isGood = true;

                    switch (parameterDetails?.type) {
                        case ParameterType.Number:
                            isGood = typeof valueHere === 'number';
                            break;
                        case ParameterType.Color:
                            isGood = typeof valueHere === 'object' && Object.hasOwn(valueHere, 'type');
                            break;
                        case ParameterType.Font:
                        case ParameterType.String:
                            isGood = typeof valueHere === 'string';
                            break;
                        case ParameterType.Size:
                            isGood = typeof valueHere === 'object' && Object.hasOwn(valueHere, 'distance');
                            break;
                        case ParameterType.Angle:
                            isGood = typeof valueHere === 'object' &&
                                Object.hasOwn(valueHere, 'unit') &&
                                [
                                    'deg',
                                    'rad',
                                ].includes((valueHere as Angle).unit);
                            break;
                        case ParameterType.Children:
                            isGood = typeof valueHere === 'object' && Object.hasOwn(valueHere, 'length');
                            break;
                    }

                    if (!isGood) {
                        throw new MaginetError(
                            `Detected discrepancy in passed data for parameter ${parameterDetails.displayKey} (in ` +
                            `instance ${this.id} of ${this.component.displayName}/${this.component.id}):\n` +
                            `\tExpected type: ${parameterDetails.type}\n\tGot value: ` +
                            `${MaginetError.processValue(valueHere)}\n`,
                        );
                    }
                }

                return {
                    ...parameterDetails,
                    value: valueHere,
                };
            }),
            this.id,
            this,
        );
    }

    locateSelfInComponent(viewingComponent: ComponentInstance<any>) {
        const component = viewingComponent;
    }
}