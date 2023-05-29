import Maginet from '../Maginet';
import { DefaultParameterId, Parameter, ParameterType, ParameterValue } from '../types';
import ComponentInstance from './ComponentInstance';
import ComponentInstanceFactory from './ComponentInstanceFactory';

export type RenderMethod<T extends string> = (parameterValue: ParameterValue<T>[], maginet: Maginet) => HTMLElement;

export interface ParametersFrom<T extends string> extends Omit<Parameter, 'id'> {
    id: T | DefaultParameterId,
}

export default class Component<T extends string = string> {
    public parameters: ParametersFrom<T>[];
    public contents: ComponentInstanceFactory[];
    public id: string;
    public renderMethod: RenderMethod<T>;
    public displayName: string;
    public isSelectable: boolean;

    constructor(
        parameters: ParametersFrom<T>[],
        allowChildren: boolean,
        contents: ComponentInstanceFactory[],
        renderMethod: RenderMethod<T>,
        id: string,
        displayName: string,
        isSelectable: boolean = true,
    ) {
        this.isSelectable = isSelectable;
        this.displayName = displayName;
        this.contents = contents;
        this.parameters = [
            ...parameters,
            {
                displayKey: 'X',
                id: DefaultParameterId.X,
                type: ParameterType.Size,
            },
            {
                displayKey: 'Y',
                id: DefaultParameterId.Y,
                type: ParameterType.Size,
            },
            {
                displayKey: 'Layer Depth',
                id: DefaultParameterId.LayerDepth,
                type: ParameterType.Number,
            },
            ...(
                allowChildren ?
                    [
                        {
                            displayKey: 'Contents',
                            id: DefaultParameterId.Children,
                            type: ParameterType.Children,
                        },
                    ] :
                    []
            ),
        ];
        this.renderMethod = renderMethod;
        this.id = id;
    }

    render(parameterValue: ParameterValue<T>[], me: ComponentInstance, maginet: Maginet, interactable: boolean = true) {
        const renderRes = this.renderMethod(parameterValue, maginet);

        if (interactable) {
            return maginet.makeSelectable(renderRes, me);
        } else {
            return renderRes;
        }
    }

    addParameter(key: string, type: ParameterType, id: T) {
        this.parameters.push({
            displayKey: key,
            type,
            id,
        });
    }

    removeParameter(id: T) {
        this.parameters = this.parameters.filter(e => e.id !== id);
    }
}