import getDefaultValueForType from '../lib/utils/getDefaultValueForType';
import getInstanceId from '../lib/utils/getInstanceId';
import { DefaultParameterId, Parameter, ParameterType, ParameterValue } from '../types';
import ComponentInstanceFactory from './ComponentInstanceFactory';
import Renderer from './Renderer';

export type RenderMethod<T extends string> = (parameterValue: ParameterValue<T>[], renderer: Renderer) => HTMLElement;

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
    public defaultParameterValues: ParameterValue<T>[];

    constructor(
        parameters: ParametersFrom<T>[],
        allowChildren: boolean,
        contents: ComponentInstanceFactory[],
        renderMethod: RenderMethod<T>,
        id: string,
        displayName: string,
        isSelectable: boolean = true,
        defaultParameterValues: ParameterValue<T>[] = [],
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
        this.defaultParameterValues = this
            .parameters
            .map(e => {
                const lookup = defaultParameterValues.find(d => d.id === e.id);
                if (lookup) {
                    return lookup;
                }

                return {
                    id: e.id,
                    value: getDefaultValueForType(e.type),
                };
            });
        this.renderMethod = renderMethod;
        this.id = id;
    }

    render(
        parameterValue: ParameterValue<T>[],
        me: ComponentInstanceFactory<Component<T | DefaultParameterId>> | null,
        renderer: Renderer,
    ) {
        const renderRes = this.renderMethod(parameterValue, renderer);

        if (renderer.interactable && me) {
            renderRes.setAttribute('id', getInstanceId(me));
            return renderer.maginet.makeSelectable(renderRes, me as ComponentInstanceFactory<any>);
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