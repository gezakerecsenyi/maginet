import SearchableMap from '../lib/utils/SearchableMap';
import { ParameterValue, SpecialParameterId } from '../types';
import Component from './Component';
import ComponentInstanceFactory from './ComponentInstanceFactory';
import Renderer from './Renderer';

export default class ComponentInstance<T extends string = string> {
    public component: Component<T>;
    public fromFactory: ComponentInstanceFactory<Component<T | SpecialParameterId>> | null;

    constructor(
        id: string,
        parameterValues: ParameterValue<T>[],
        component: Component<T>,
        fromFactory: ComponentInstanceFactory<Component<SpecialParameterId | T>> | null = null,
    ) {
        this.fromFactory = fromFactory;
        this.component = component;
        this.parameterValues = new SearchableMap(...parameterValues);
        this.id = id;
    }
    public id: string;

    private _parameterValues!: SearchableMap<T | SpecialParameterId, ParameterValue<T>>;

    get parameterValues() {
        return this._parameterValues;
    }

    set parameterValues(value) {
        this._parameterValues =
            this.component.withDefaults(value) as SearchableMap<T | SpecialParameterId, ParameterValue<T>>;
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