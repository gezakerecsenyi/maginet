import MaginetError from '../lib/utils/MaginetError';
import SearchableMap from '../lib/utils/SearchableMap';
import updateFromLocation from '../lib/utils/updateFromLocation';
import Maginet from '../Maginet';
import {
    Angle,
    ImmutableSpecialParameters,
    Magazine,
    ParameterType,
    ParameterValue,
    ParameterValueType,
    SpecialParameterId,
} from '../types';
import { EditMode } from '../ui/SpreadRenderer';
import { PopulatedWindow } from '../window';
import Component from './Component';
import ComponentInstance from './ComponentInstance';
import { ParameterCalculator } from './ParameterCalculator';

export interface ParameterAssociationDescriptor {
    locationId: string;
    id: SpecialParameterId | string;
}

export type ParameterOf<R> = (R extends Component<infer U> ? U : never) | SpecialParameterId;
export type ParameterCalculatorMap<R extends Component<ParameterOf<R>>> = SearchableMap<ParameterOf<R>, ParameterCalculator<ParameterOf<R>>>;

export default class ComponentInstanceFactory<R extends Component<ParameterOf<R>> = Component> {
    public component;
    public id: string;

    constructor(
        id: string,
        component: R,
        parameterMapping: ParameterCalculator<Exclude<ParameterOf<R>, ImmutableSpecialParameters>>[],
    ) {
        this.component = component;
        this.parameterMapping = new SearchableMap(...parameterMapping);
        this.id = id;
    }

    private _parameterMapping!: ParameterCalculatorMap<R>;

    get parameterMapping() {
        return this._parameterMapping;
    }

    set parameterMapping(value: ParameterCalculatorMap<R>) {
        this._parameterMapping = this.component.withDefaults(value) as ParameterCalculatorMap<R>;
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
            let [resolvedValue, resolvedValueLocation] = parameterHere.resolveValue(
                maginet.magazine,
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
        return new ComponentInstance<ParameterOf<R>>(this.id, this.parameterMapping.map(p => {
            const valueHere = p.value ?? (p.resolveValue(
                magazine,
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
        }), this.component, this);
    }

    locateSelfInComponent<T extends string>(
        magazine: Magazine,
        parameterValues: SearchableMap<T | SpecialParameterId, ParameterValue<T>>,
        component: Component<T>,
        pathSoFar: string[] = [],
    ): string[] | null {
        const childrenHere = parameterValues
            .asSecondaryKey(component.parameters)
            .filter(e => e.isRenderedAsChildren)
            .map(e => [
                e.id,
                e.value as ComponentInstanceFactory[],
            ] as const);

        for (let childListHere of childrenHere) {
            if (childListHere[1].find(e => e.id === this.id)) {
                return pathSoFar.concat(childListHere[0], this.id);
            }
        }

        for (let childListHere of childrenHere) {
            for (let child of childListHere[1]) {
                const resolvedParameters = child
                    .parameterMapping
                    .map(e => {
                        const valueHere = e.resolveValue(
                            magazine,
                            true,
                            null,
                        );
                        return {
                            id: e.id,
                            value: valueHere[0]!,
                            path: valueHere[1],
                        };
                    })
                    .filter((e) => e.value !== null) as ParameterValue[];

                const resHere = this.locateSelfInComponent(
                    magazine,
                    new SearchableMap<string, ParameterValue>(...resolvedParameters),
                    child.component,
                    pathSoFar.concat(childListHere[0], 'value', child.id, 'parameterMapping'),
                );

                if (resHere) {
                    return resHere;
                }
            }
        }

        return null;
    }
}