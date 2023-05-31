import SearchableMap from '../lib/utils/SearchableMap';
import { DefaultParameterId, ParameterValue } from '../types';
import Component from './Component';
import ComponentInstanceFactory from './ComponentInstanceFactory';
import Renderer from './Renderer';

export default class ComponentInstance<T extends string = string> {
    public component: Component<T>;
    public parameterValues: SearchableMap<T | DefaultParameterId, ParameterValue<T>>;
    public fromFactory: ComponentInstanceFactory<Component<T | DefaultParameterId>> | null;
    public id: string;

    constructor(
        component: Component<T>,
        parameterValues: ParameterValue<T>[],
        id: string,
        fromFactory: ComponentInstanceFactory<Component<T | DefaultParameterId>> | null = null,
    ) {
        this.fromFactory = fromFactory;
        this.component = component;
        this.parameterValues = new SearchableMap(...parameterValues);
        this.id = id;
    }

    addChild(child: ComponentInstanceFactory<any>) {
        const currentChildren = this.parameterValues.getById(DefaultParameterId.Children);
        this
            .parameterValues
            .updateById(
                DefaultParameterId.Children,
                {
                    value: [
                        ...(currentChildren ? currentChildren.value as ComponentInstanceFactory[] : []),
                        child,
                    ],
                },
            );

        // return [this.id, 'parameterValues', 'children', 'value', child.id];
        return child;
    }

    render(renderer: Renderer): HTMLElement {
        return this.component.render(this.parameterValues, this.fromFactory, renderer);
    }
}