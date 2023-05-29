import Component from './Component';
import { Magazine, Parameter, ParameterValue } from '../types';

export default class ComponentInstance<T extends string = string> {
    public component: Component<T>;
    public parameterValues: ParameterValue<T>[];
    public id: string;

    constructor(component: Component<T>, parameterValues: ParameterValue<T>[], id: string) {
        this.component = component;
        this.parameterValues = parameterValues;
        this.id = id;
    }

    render(magazine: Magazine): HTMLElement {
        return this.component.render(this.parameterValues, magazine);
    }
}