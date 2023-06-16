import { ParentComponent, SpecialParameterId } from '../../types';

export default class ParentRelationDescriptor<T extends string = string> {
    contextualId: string = '';

    constructor(
        component: ParentComponent<T>,
        parameterId: SpecialParameterId | T,
    ) {
        this.parameterId = parameterId;
        this.component = component;
    }

    private _parameterId!: T | SpecialParameterId;

    get parameterId(): SpecialParameterId | T {
        return this._parameterId;
    }

    set parameterId(value: SpecialParameterId | T) {
        this._parameterId = value;
        this.contextualId = this.getContextualId();
    }

    private _component!: ParentComponent<T>;

    get component(): ParentComponent<T> {
        return this._component;
    }

    set component(value: ParentComponent<T>) {
        this._component = value;
        this.contextualId = this.getContextualId();
    }

    getContextualId() {
        return `${this.parameterId}.${this.component?.id || ''}`;
    }
}