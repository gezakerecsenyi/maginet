import MaginetError from '../lib/utils/MaginetError';
import SearchableMap from '../lib/utils/SearchableMap';
import updateFromLocation from '../lib/utils/updateFromLocation';
import validateType from '../lib/utils/validateType';
import Maginet from '../Maginet';
import {
    ComponentCompositionType,
    ImmutableSpecialParameters,
    Magazine,
    ParameterValue,
    ParameterValueDatum,
    ParentRelationDescriptor,
    SpecialParameterId,
} from '../types';
import { EditMode } from '../ui/SpreadRenderer';
import { PopulatedWindow } from '../window';
import Component from './Component';
import ComponentInstance from './ComponentInstance';
import { ParameterCalculator } from './ParameterCalculator';

export type ParameterOf<R extends Component<any>> = (R extends Component<infer U> ? U : never) | SpecialParameterId;
export type ParameterCalculatorMap<R extends Component<any>> = SearchableMap<ParameterOf<R>, ParameterCalculator<ParameterOf<R>>>;

export type ComponentInstanceFactoryData<R extends string, M extends string> = {
    id: string,
    component: Component<R | SpecialParameterId>,
    parameterMapping: ParameterCalculator<Exclude<R | SpecialParameterId, ImmutableSpecialParameters>>[],
    parent: ParentRelationDescriptor<M>,
}

export default class ComponentInstanceFactory<R extends string = string, M extends string = any> {
    public component;
    public id: string;
    public readonly compositionType = ComponentCompositionType.Factory;
    public parent: ParentRelationDescriptor<M>;
    private _parameterMapping!: ParameterCalculatorMap<Component<R | SpecialParameterId>>;

    constructor({
        id,
        component,
        parameterMapping,
        parent,
    }: ComponentInstanceFactoryData<R, M>) {
        this.component = component;
        this.parameterMapping = new SearchableMap(...parameterMapping);
        this.id = id;
        this.parent = parent;
    }

    get parameterMapping() {
        return this._parameterMapping;
    }

    set parameterMapping(value) {
        this._parameterMapping =
            this.component.withDefaults(value) as ParameterCalculatorMap<Component<R | SpecialParameterId>>;
    }

    static getInstanceId(instance: ComponentInstanceFactory<any>): string {
        return `${instance.id}-${instance.component.id}`;
    }

    getInstanceId(): string {
        return ComponentInstanceFactory.getInstanceId(this);
    }

    respectfullyUpdateParameter(
        maginet: Maginet,
        parameter: R | SpecialParameterId,
        update: (currentValue: ParameterValueDatum, foundAt?: string[]) => ParameterValueDatum,
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
                    //todo: this doesn't invert node-calculators
                    updateFromLocation(
                        maginet.magazine,
                        resolvedValueLocation,
                        update(resolvedValue!, resolvedValueLocation),
                    );
                }
            }
        }
    }

    composeComponentInstance(magazine: Magazine): ComponentInstance<SpecialParameterId | R, M> {
        return new ComponentInstance<R | SpecialParameterId, M>(
            this.id,
            this.component,
            this.parameterMapping.map(p => {
                const valueHere = p.value ?? (p.resolveValue(
                    magazine,
                    true,
                    null,
                )[0] || 0);

                const parameterDetails = this.component.parameters.getById(p.id)!;
                if ((window as PopulatedWindow).debug) {
                    if (!validateType(parameterDetails.type, valueHere)) {
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
            this,
            this.parent,
        );
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