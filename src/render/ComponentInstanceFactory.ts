import MaginetError from '../lib/utils/MaginetError';
import {
    DefiniteParameterCalculator,
    ParameterCalculator,
    ParameterCalculatorData,
} from '../lib/utils/ParameterCalculator';
import ParentRelationDescriptor from '../lib/utils/ParentRelationDescriptor';
import SearchableMap from '../lib/utils/SearchableMap';
import validateType from '../lib/utils/validateType';
import Maginet from '../Maginet';
import {
    ComponentCompositionType,
    ImmutableSpecialParameters,
    Optional,
    ParameterValueDatum,
    ParentComponent,
    SpecialParameterId,
} from '../types';
import { EditMode } from '../ui/SpreadRenderer';
import { PopulatedWindow } from '../window';
import Component from './Component';
import ComponentInstance from './ComponentInstance';

export type ParameterOf<R extends Component<any>> = (R extends Component<infer U> ? U : never) | SpecialParameterId;
export type ParameterCalculatorMap<R extends string> = SearchableMap<R | SpecialParameterId, ParameterCalculator<R | SpecialParameterId>>;

export type ComponentInstanceFactoryData<IDs extends string, ParentIDs extends string> = {
    id: string,
    component: Component<IDs | SpecialParameterId>,
    parameterMapping: ParameterCalculator<IDs | Exclude<SpecialParameterId, ImmutableSpecialParameters>>[],
    parent: ParentRelationDescriptor<ParentIDs>,
}

export default class ComponentInstanceFactory<IDs extends string = string, ParentIDs extends string = string> {
    public component;
    public id: string;
    public readonly compositionType = ComponentCompositionType.Factory;
    public parent: ParentRelationDescriptor<ParentIDs>;
    private _parameterMapping!: ParameterCalculatorMap<IDs>;

    constructor({
        id,
        component,
        parameterMapping,
        parent,
    }: ComponentInstanceFactoryData<IDs, ParentIDs>) {
        this.component = component;
        this.parameterMapping = new SearchableMap(...parameterMapping) as ParameterCalculatorMap<IDs>;
        this.id = id;
        this.parent = parent;
    }

    get parameterMapping() {
        return this._parameterMapping;
    }

    set parameterMapping(value) {
        this._parameterMapping = (
            this
                .component
                .withDefaults(value) as ParameterCalculatorMap<IDs>
        )
            .sMap(t => t.asChildOf(this));
    }

    static getInstanceId(instance: ComponentInstanceFactory<any, any>): string {
        return `${instance.id}-${instance.component.id}`;
    }

    getInstanceId(): string {
        return ComponentInstanceFactory.getInstanceId(this);
    }

    respectfullyUpdateParameter(
        maginet: Maginet,
        parameter: IDs | SpecialParameterId,
        update: (
            currentValue: ParameterValueDatum,
            foundIn: Exclude<ParentComponent<any>, null>,
        ) => ParameterValueDatum,
    ) {
        const parameterHere = this
            .parameterMapping
            .getById(parameter);

        if (!parameterHere?.isReference) {
            this.setParameter(
                parameter,
                {
                    value: update(parameterHere!.value!, this),
                    isReference: false,
                },
            );
        } else if (parameterHere) {
            let [resolvedValue, resolvedIn] = parameterHere.resolveValue();

            if (maginet.spreadRenderer.editMode === EditMode.Value) {
                if (resolvedValue !== null) {
                    this.setParameter(
                        parameter,
                        {
                            value: update(resolvedValue!, resolvedIn || this),
                            isReference: false,
                        },
                    );
                }
            } else if (maginet.spreadRenderer.editMode === EditMode.Reference) {
                parameterHere.updateValueReference(update(resolvedValue!, resolvedIn || this));
            }
        }
    }

    composeComponentInstance(): ComponentInstance<SpecialParameterId | IDs, ParentIDs> {
        return new ComponentInstance<IDs | SpecialParameterId, ParentIDs>(
            this.id,
            this.component,
            this.parameterMapping.map(p => {
                const valueHere = p.isReference ? (p.resolveValue()[0] || p.value || 0) : p.value!;

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

                return new ParameterCalculator(
                    p.id,
                    {
                        isReference: false,
                        value: valueHere,
                        belongsTo: this,
                    },
                ) as DefiniteParameterCalculator<IDs | SpecialParameterId>;
            }),
            this,
        );
    }

    setParameter(
        parameterId: IDs | SpecialParameterId,
        data: Optional<ParameterCalculatorData<SpecialParameterId | IDs>, 'belongsTo'>,
    ) {
        this
            .parameterMapping
            .setById(
                parameterId,
                new ParameterCalculator(
                    parameterId,
                    {
                        belongsTo: this as ComponentInstanceFactory<any, any>,
                        ...data,
                    },
                ),
            );

        return this;
    }
}