import Maginet from '../Maginet';
import { DefaultParameterId, ParameterValue } from '../types';
import Component from './Component';
import ComponentInstanceFactory from './ComponentInstanceFactory';

export default class ComponentInstance<T extends string = string> {
    public component: Component<T>;
    public parameterValues: ParameterValue<T>[];
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
        this.parameterValues = parameterValues;
        this.id = id;
    }

    render(maginet: Maginet): HTMLElement {
        return this.component.render(this.parameterValues, this.fromFactory, maginet);
    }
}