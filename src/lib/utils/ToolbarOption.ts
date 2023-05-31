import Component from '../../render/Component';
import { DefaultParameterId, ToolType } from '../../types';

export interface ComponentDragSpec<T extends string> {
    component: Component<T>,
    bindWidthTo?: (T | DefaultParameterId)[],
    bindHeightTo?: (T | DefaultParameterId)[],
}

export interface ToolbarOptionData<T extends string> {
    tooltip: string;
    optionType: ToolType;
    suboptions?: ToolbarOption<any>[];
    insertableByDrag?: ComponentDragSpec<T>;
}

// helper class to allow for strict typing of property bindings
export default class ToolbarOption<T extends string = string> {
    public tooltip: string;
    public optionType: ToolType;
    public suboptions: ToolbarOption[] | undefined;
    public insertableByDrag: ComponentDragSpec<T> | undefined;

    constructor(data: ToolbarOptionData<T>) {
        this.tooltip = data.tooltip;
        this.optionType = data.optionType;
        this.suboptions = data.suboptions;
        this.insertableByDrag = data.insertableByDrag;
    }
}