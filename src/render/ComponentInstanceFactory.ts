import MaginetError from '../lib/utils/MaginetError';
import SearchableMap from '../lib/utils/SearchableMap';
import updateFromLocation from '../lib/utils/updateFromLocation';
import Maginet from '../Maginet';
import { Angle, DefaultParameterId, Magazine, ParameterType, ParameterValueType } from '../types';
import { EditMode } from '../ui/SpreadRenderer';
import { PopulatedWindow } from '../window';
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

export type ParameterOf<R> = (R extends Component<infer U> ? U : never) | DefaultParameterId;
type ParameterMap<R extends Component<ParameterOf<R>>> = SearchableMap<ParameterOf<R>, ParameterCalculator<ParameterOf<R>>>;

export default class ComponentInstanceFactory<R extends Component<ParameterOf<R>> = Component> {
    constructor(component: R, parameterMapping: ParameterCalculator<ParameterOf<R>>[], id: string) {
        this.component = component;
        this.parameterMapping = new SearchableMap(...parameterMapping);
        this.id = id;
    }

    private _parameterMapping!: ParameterMap<R>;

    public component;

    get parameterMapping() {
        return this._parameterMapping;
    }
    public id: string;

    set parameterMapping(value: ParameterMap<R>) {
        this._parameterMapping = new SearchableMap(...value).concatIfNew(
            ...this
                .component
                .defaultParameterValues
                .map(e => ({
                    ...e,
                    isReference: false,
                })),
        );
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
}