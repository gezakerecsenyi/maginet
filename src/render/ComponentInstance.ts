import Maginet from '../Maginet';
import { ParameterValue } from '../types';
import Component from './Component';

export default class ComponentInstance<T extends string = string> {
    public component: Component<T>;
    public parameterValues: ParameterValue<T>[];
    public id: string;

    constructor(component: Component<T>, parameterValues: ParameterValue<T>[], id: string) {
        this.component = component;
        this.parameterValues = parameterValues;
        this.id = id;
    }

    render(maginet: Maginet): HTMLElement {
        return this.component.render(this.parameterValues, this, maginet);
    }
}