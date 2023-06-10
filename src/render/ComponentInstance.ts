import MaginetError from '../lib/utils/MaginetError';
import SearchableMap from '../lib/utils/SearchableMap';
import validateType from '../lib/utils/validateType';
import { ComponentCompositionType, ParameterValue, SpecialParameterId } from '../types';
import { PopulatedWindow } from '../window';
import Component from './Component';
import ComponentInstanceFactory from './ComponentInstanceFactory';
import Renderer from './Renderer';

export default class ComponentInstance<T extends string = string> {
    public component: Component<T>;
    public fromFactory: ComponentInstanceFactory<Component<T | SpecialParameterId>> | null;
    public readonly compositionType = ComponentCompositionType.Instance;
    public id: string;

    constructor(
        id: string,
        component: Component<T>,
        parameterValues: ParameterValue<T>[],
        fromFactory: ComponentInstanceFactory<Component<SpecialParameterId | T>> | null = null,
    ) {
        this.id = id;

        this.fromFactory = fromFactory;
        this.component = component;
        this.parameterValues = new SearchableMap(...parameterValues);
    }

    private _parameterValues!: SearchableMap<T | SpecialParameterId, ParameterValue<T>>;

    get parameterValues() {
        return this._parameterValues;
    }

    set parameterValues(value) {
        this._parameterValues = this
            .component
            .withDefaults(value) as SearchableMap<T | SpecialParameterId, ParameterValue<T>>;

        if ((window as PopulatedWindow).debug) {
            this
                ._parameterValues
                .asSecondaryKey(this.component.parameters)
                .forEach(param => {
                    if (!validateType(param.type, param.value)) {
                        throw new MaginetError(
                            `Detected discrepancy in passed data for parameter ${param.displayKey} (in ` +
                            `component update for ${this.component.displayName} instance ${this.id}):\n` +
                            `\tExpected type: ${param.type}\n\tGot value: ` +
                            `${MaginetError.processValue(param.value)}\n`,
                        );
                    }
                });
        }
    }

    addChild(child: ComponentInstanceFactory<any>) {
        const currentChildren = this.parameterValues.getById(SpecialParameterId.Children);
        this
            .parameterValues
            .updateById(
                SpecialParameterId.Children,
                {
                    value: [
                        ...(currentChildren ? currentChildren.value as ComponentInstanceFactory[] : []),
                        child,
                    ],
                },
            );

        return child;
    }

    render(renderer: Renderer): HTMLElement {
        return this.component.render(this.parameterValues, this.fromFactory, renderer);
    }
}