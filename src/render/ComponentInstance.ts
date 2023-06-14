import MaginetError from '../lib/utils/MaginetError';
import SearchableMap from '../lib/utils/SearchableMap';
import validateType from '../lib/utils/validateType';
import {
    ComponentCompositionType,
    Optional,
    ParameterValue,
    ParentRelationDescriptor,
    SpecialParameterId,
} from '../types';
import { PopulatedWindow } from '../window';
import Component from './Component';
import ComponentInstanceFactory, { ComponentInstanceFactoryData } from './ComponentInstanceFactory';
import RenderContext from './RenderContext';

export default class ComponentInstance<T extends string = string, M extends string = any> {
    public component: Component<T>;
    public fromFactory: ComponentInstanceFactory<T | SpecialParameterId> | null;
    public readonly compositionType = ComponentCompositionType.Instance;
    public id: string;
    private parent: ParentRelationDescriptor<M>;

    constructor(
        id: string,
        component: Component<T>,
        parameterValues: ParameterValue<T>[],
        fromFactory: ComponentInstanceFactory<T | SpecialParameterId> | null = null,
        parent: ParentRelationDescriptor<M>,
    ) {
        this.id = id;

        this.parent = parent;

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

    addChildren(...childData: Optional<ComponentInstanceFactoryData<any, any>, 'parent'>[]) {
        const currentChildren = this.parameterValues.getById(SpecialParameterId.Children);
        const newChildren = childData.map(childSpec => new ComponentInstanceFactory(
            {
                parent: {
                    component: this,
                    parameter: SpecialParameterId.Children,
                },
                ...childSpec,
            },
        ));
        this
            .parameterValues
            .updateById(
                SpecialParameterId.Children,
                {
                    value: [
                        ...(currentChildren ? currentChildren.value as ComponentInstanceFactory[] : []),
                        ...newChildren,
                    ],
                },
            );

        return newChildren;
    }

    render(renderer: RenderContext): HTMLElement {
        return this
            .component
            .render(this.parameterValues, this.fromFactory, renderer);
    }
}