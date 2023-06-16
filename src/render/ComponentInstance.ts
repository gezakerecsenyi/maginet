import MaginetError from '../lib/utils/MaginetError';
import { DefiniteParameterCalculator, ParameterCalculator } from '../lib/utils/ParameterCalculator';
import ParentRelationDescriptor from '../lib/utils/ParentRelationDescriptor';
import RenderContext from '../lib/utils/RenderContext';
import SearchableMap from '../lib/utils/SearchableMap';
import validateType from '../lib/utils/validateType';
import { ComponentCompositionType, Optional, ParameterValueDatum, SpecialParameterId } from '../types';
import { PopulatedWindow } from '../window';
import Component from './Component';
import ComponentInstanceFactory, { ComponentInstanceFactoryData } from './ComponentInstanceFactory';

export type ChildDefinition<A extends string = any, B extends string = any> = Optional<ComponentInstanceFactoryData<A, B>, 'parent' | 'parameterMapping'>;

export default class ComponentInstance<IDs extends string = string, ParentIDs extends string = string> {
    public component: Component<IDs>;
    public fromFactory: ComponentInstanceFactory<IDs | SpecialParameterId, ParentIDs> | null;
    public readonly compositionType = ComponentCompositionType.Instance;
    public id: string;
    public parent: ParentRelationDescriptor<ParentIDs> | null;
    private _parameterValues!: SearchableMap<IDs | SpecialParameterId, DefiniteParameterCalculator<IDs>>;

    constructor(
        id: string,
        component: Component<IDs>,
        parameterValues: DefiniteParameterCalculator<IDs>[],
        fromFactory: ComponentInstanceFactory<IDs | SpecialParameterId, ParentIDs> | null = null,
    ) {
        this.id = id;

        this.parent = fromFactory?.parent || null;

        this.fromFactory = fromFactory;
        this.component = component;
        this.parameterValues = new SearchableMap(...parameterValues);
    }

    get parameterValues() {
        return this._parameterValues;
    }

    set parameterValues(value) {
        this._parameterValues = (
            this
                .component
                .withDefaults(value) as SearchableMap<IDs | SpecialParameterId, DefiniteParameterCalculator<IDs>>
        )
            .sMap(e => e.asChildOf(this as ComponentInstance<any, any>));

        if ((window as PopulatedWindow).debug) {
            this
                ._parameterValues
                .asSecondaryKey(this.component.parameters)
                .forEach(param => {
                    if (!validateType(param.type, param.value!)) {
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

    updateParameter(id: IDs | SpecialParameterId, value: ParameterValueDatum) {
        const currentValue = this.parameterValues.getById(id);
        if (currentValue) {
            this.parameterValues.setById(
                id,
                new ParameterCalculator(
                    id,
                    {
                        ...currentValue.data,
                        belongsTo: this as ComponentInstance<any, any>,
                        value: value,
                    },
                ),
            );
        }
    }

    addChild<A extends string, B extends string>(childData: ChildDefinition<A, B>): ComponentInstanceFactory<A, B> {
        return this.addChildren(childData)[0];
    }

    addChildren(...childData: ChildDefinition[]) {
        const currentChildren = this.parameterValues.getById(SpecialParameterId.Children);
        const newChildren = childData.map(childSpec => new ComponentInstanceFactory(
            {
                parent: new ParentRelationDescriptor(this, SpecialParameterId.Children),
                parameterMapping: [],
                ...childSpec,
            },
        ));
        this.updateParameter(
            SpecialParameterId.Children,
            [
                ...(currentChildren ? currentChildren.value as ComponentInstanceFactory[] : []),
                ...newChildren,
            ],
        );

        return newChildren;
    }

    render(renderer: RenderContext): HTMLElement {
        return this
            .component
            .render(this.parameterValues, this.fromFactory, renderer);
    }
}